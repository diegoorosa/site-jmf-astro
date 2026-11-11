import { GoogleGenerativeAI } from '@google/generative-ai';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const rssParser = new Parser({ timeout: 8000 });

// FEEDS DE NOTÍCIAS OFICIAIS E CONTÁBEIS
const RSS_FEEDS = [
  'https://www.portalcontnews.com.br/feed/',
  'https://www.contabeis.com.br/rss/noticias/',
  'https://www.jornalcontabil.com.br/feed/',
  'https://cfc.org.br/feed/' // o domínio noticias.cfc.org.br foi desativado (ENOTFOUND)
];

/* ------------------------------------------------------------------ *
 * CAMADA DE RESILIÊNCIA DO GEMINI
 * O erro que derrubava o Action era 503 "high demand" em todos os
 * modelos da lista, sem nenhuma nova tentativa. Agora:
 *  1. a lista de modelos é descoberta na API (não fica presa a nomes fixos);
 *  2. cada modelo é tentado várias vezes com backoff exponencial + jitter;
 *  3. respeita o RetryInfo devolvido pelo Google;
 *  4. modelo inexistente/depreciado é pulado, não derruba o job.
 * ------------------------------------------------------------------ */

const REQUEST_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 180000);
const MAX_ATTEMPTS_PER_MODEL = Number(process.env.GEMINI_MAX_ATTEMPTS_PER_MODEL || 3);
const BASE_BACKOFF_MS = Number(process.env.GEMINI_BASE_BACKOFF_MS || 4000);
const MAX_BACKOFF_MS = Number(process.env.GEMINI_MAX_BACKOFF_MS || 30000);
// Orçamento total por chamada: sem isso, 10 modelos × 3 tentativas × 30s
// poderia estourar o timeout de 30 min do workflow.
const TOTAL_BUDGET_MS = Number(process.env.GEMINI_TOTAL_BUDGET_MS || 8 * 60 * 1000);

// Usados quando a descoberta via API falha. Aliases "latest" primeiro.
const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash'
];

const TRANSIENT_STATUS = new Set([0, 429, 500, 502, 503, 504]);
const SKIP_MODEL_STATUS = new Set([400, 404]);
const FATAL_STATUS = new Set([401, 403]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function statusOf(err) {
  if (typeof err?.status === 'number') return err.status;
  const match = String(err?.message || err).match(/\[(\d{3})\s/);
  return match ? Number(match[1]) : 0;
}

// O Google devolve {"@type":".../google.rpc.RetryInfo","retryDelay":"17s"} no 503/429
function retryDelayFromError(err, attempt) {
  const details = err?.errorDetails;
  if (Array.isArray(details)) {
    for (const d of details) {
      const raw = d?.retryDelay;
      if (typeof raw === 'string') {
        const secs = parseFloat(raw.replace(/s$/, ''));
        if (Number.isFinite(secs) && secs > 0) return Math.min(secs * 1000, MAX_BACKOFF_MS);
      }
    }
  }
  const base = BASE_BACKOFF_MS * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 1500);
  return Math.min(base + jitter, MAX_BACKOFF_MS);
}

function versionRank(name) {
  const m = name.match(/(\d+)(?:\.(\d+))?/);
  if (!m) return 0;
  return Number(m[1]) * 100 + Number(m[2] || 0);
}

async function discoverModels() {
  if (!API_KEY) throw new Error('GEMINI_API_KEY ausente');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(API_KEY)}`,
    { signal: AbortSignal.timeout(20000) }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} ao listar modelos`);
  const data = await res.json();

  const usable = (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => String(m.name || '').replace(/^models\//, ''))
    .filter((n) => /flash/i.test(n))
    .filter((n) => !/(embedding|tts|image|vision|live|audio|native|veo|imagen)/i.test(n));

  const isUnstable = (n) => /(preview|exp|experimental)/i.test(n);
  const byVersionDesc = (list) => [...new Set(list)].sort((a, b) => versionRank(b) - versionRank(a));

  return [
    ...byVersionDesc(usable.filter((n) => !isUnstable(n))),
    ...byVersionDesc(usable.filter(isUnstable))
  ];
}

let modelChainPromise = null;
function getModelChain() {
  if (modelChainPromise) return modelChainPromise;
  modelChainPromise = (async () => {
    const fromEnv = (process.env.GEMINI_MODELS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let discovered = [];
    try {
      discovered = await discoverModels();
      console.log(`🔎 Modelos disponíveis na API: ${discovered.slice(0, 6).join(', ')}${discovered.length > 6 ? '…' : ''}`);
    } catch (err) {
      console.warn(`⚠️ Não foi possível listar modelos (${err.message}). Usando lista fixa.`);
    }

    const chain = [...new Set([...fromEnv, ...discovered, ...FALLBACK_MODELS])];
    console.log(`🤖 Cadeia de modelos: ${chain.join(' → ')}`);
    return chain;
  })();
  return modelChainPromise;
}

async function generateWithFallback(prompt, label = 'geração') {
  const models = await getModelChain();
  const failures = [];
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (const modelName of models) {
    if (Date.now() > deadline) {
      failures.push('orçamento de tempo esgotado antes de terminar a cadeia de modelos');
      break;
    }

    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        console.log(`🤖 [${label}] ${modelName} — tentativa ${attempt + 1}/${MAX_ATTEMPTS_PER_MODEL}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt, { timeout: REQUEST_TIMEOUT_MS });
        const text = (result.response.text() || '').trim();

        if (!text) throw new Error('resposta vazia do modelo');

        console.log(`✅ [${label}] sucesso com ${modelName}`);
        return text;
      } catch (err) {
        const status = statusOf(err);
        const msg = String(err?.message || err);
        failures.push(`${modelName} [${status || 'sem status'}]: ${msg.slice(0, 140)}`);

        if (FATAL_STATUS.has(status)) {
          throw new Error(
            `Credencial do Gemini rejeitada (${status}). Verifique o secret GEMINI_API_KEY. Detalhe: ${msg.slice(0, 200)}`
          );
        }

        // Chave inválida/sem permissão às vezes volta como 400, não 401/403
        if (/api key not valid|api_key_invalid|api key expired|permission denied|unauthenticated/i.test(msg)) {
          throw new Error(`Credencial do Gemini inválida. Verifique/renove o secret GEMINI_API_KEY. Detalhe: ${msg.slice(0, 200)}`);
        }

        if (SKIP_MODEL_STATUS.has(status) || /not found|not supported|unsupported|invalid argument/i.test(msg)) {
          console.warn(`⏭️  [${label}] ${modelName} indisponível (${status || 'sem status'}), pulando para o próximo modelo.`);
          break;
        }

        if (!TRANSIENT_STATUS.has(status)) {
          console.warn(`⚠️  [${label}] ${modelName} falhou (${status || 'erro inesperado'}), pulando para o próximo modelo.`);
          break;
        }

        if (attempt === MAX_ATTEMPTS_PER_MODEL - 1) {
          console.warn(`⚠️  [${label}] ${modelName} esgotou as ${MAX_ATTEMPTS_PER_MODEL} tentativas.`);
          break;
        }

        const wait = Math.min(retryDelayFromError(err, attempt), Math.max(deadline - Date.now(), 0));
        if (wait <= 0) {
          console.warn(`⏱️  [${label}] orçamento de tempo esgotado, desistindo de ${modelName}.`);
          break;
        }
        console.warn(
          `⚠️  [${label}] ${modelName} ${status === 503 ? 'sobrecarregado (503)' : status || 'falha de rede'} — nova tentativa em ${Math.round(wait / 1000)}s.`
        );
        await sleep(wait);
      }
    }
  }

  throw new Error(
    `Nenhum dos ${models.length} modelos do Gemini respondeu.\n  ${failures.slice(-8).join('\n  ')}`
  );
}

async function fetchLatestNews() {
  console.log('📡 Rastreando notícias contábeis e fiscais recentes...');
  const newsItems = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      // Busca com fetch + parseString em vez de parseURL: o parseURL do
      // rss-parser deixa sockets abertos e o processo nunca termina (job
      // fica pendurado até o timeout de 30 min do workflow).
      const res = await fetch(feedUrl, {
        signal: AbortSignal.timeout(8000),
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; JMFCrawler/1.0; +https://www.jmfcontabilidade.com.br)',
          accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const feed = await rssParser.parseString(await res.text());
      feed.items.slice(0, 6).forEach((item) => {
        if (item.title) {
          newsItems.push({
            title: item.title,
            snippet: (item.contentSnippet || item.content || '').slice(0, 200),
            link: item.link || ''
          });
        }
      });
      console.log(`   ✔ ${feedUrl} (${feed.items.length} itens)`);
    } catch (err) {
      console.warn(`⚠️ Não foi possível ler feed ${feedUrl}: ${err.message}`);
    }
  }
  return newsItems;
}

const EXISTING_TOPICS = process.env.EXISTING_TOPICS || '';
const FORCED_TOPIC = process.env.FORCED_TOPIC || '';

const AUTHORS = [
  'Diego Rosa, CRC SC-035810/O',
  'Fabricio Rosa, CRC SC-029833/O'
];

const INTERNAL_LINKS = {
  tributario: '/consultoria-e-planejamento-tributario',
  fiscal: '/gestao-fiscal-e-tributaria',
  pessoal: '/gestao-pessoal',
  gerencial: '/gestao-contabil',
  irpf: '/imposto-de-renda',
  mei: '/abertura-de-empresa',
  abertura: '/abertura-de-empresa',
  regimes: '/regimes-tributarios',
  contador: '/contabilidade-para-empresas',
  padrao: '/fale-conosco'
};

function getTodayBR() {
  const now = new Date();
  const brTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const day = brTime.getDay();
  if (day === 0 || day === 6) {
    const daysToAdd = day === 0 ? 1 : 2;
    brTime.setDate(brTime.getDate() + daysToAdd);
  }
  return brTime.toISOString().split('T')[0];
}

function getCurrentMonthYearBR() {
  const now = new Date();
  const brTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${months[brTime.getMonth()]}/${brTime.getFullYear()}`;
}

function buildPrompt(newsItems) {
  const today = getTodayBR();
  const currentMonthYear = getCurrentMonthYearBR();
  const author = Math.random() > 0.5 ? AUTHORS[0] : AUTHORS[1];

  let newsContext = '';
  if (newsItems.length > 0) {
    newsContext = newsItems.map((n, i) => `[Notícia ${i + 1}]: ${n.title}\nResumo: ${n.snippet}`).join('\n\n');
  }

  let prompt = `Você é o redator contábil e fiscal sênior da JMF Contabilidade (Blumenau/SC).

NOTÍCIAS E PAUTAS QUENTES CAPTURADAS HOJE NOS PORTAIS CONTÁBEIS:
${newsContext || 'Nenhuma notícia nova capturada via RSS. Use os temas prioritários do mês atual.'}

TÓPICOS JÁ PUBLICADOS NO BLOG (NÃO REPITA ESSES TEMAS):
${EXISTING_TOPICS || '(nenhum histórico disponível)'}

MISSÃO EDITORIAL:
1. Escolha a notícia ou tema mais relevante para empresas, comércios, indústrias ou prestadores de serviços de Blumenau e SC referente ao mês de ${currentMonthYear}.
2. NÃO repita tópicos recentes já listados.
3. Transforme o assunto em um artigo aprofundado, estratégico e com orientações claras.

REGRAS OBRIGATÓRIAS DE FORMATO (Retorne APENAS o Markdown puro):

---
title: "Título instigante, max 70 chars, com palavra-chave"
description: "Meta description objetiva, max 160 chars"
pubDate: ${today}
author: "${author}"
image: "/assets/images/blog-{slug}.webp"
imageAlt: "Descrição visual da imagem"
---

CONTEÚDO (1500-2200 palavras):
- Introdução contextualizando o momento atual (${currentMonthYear}) e impactos para o empresário.
- Tópicos estruturados em H2 e H3.
- Exemplos práticos voltados para Santa Catarina/Blumenau quando couber.
- PROIBIDO USAR LATEX OU CIFRÕES ($$ ou $): O blog NÃO possui suporte a KaTeX/MathJax. NUNCA use $$, \\text{}, \\times, \\frac. Todos os cálculos devem ser escritos em Markdown limpo com listas e negrito. Exemplo:
  * **Base de Cálculo:** R$ 300.000,00 × 32% = **R$ 96.000,00**
  * **IRPJ Normal (15%):** R$ 96.000,00 × 15% = **R$ 14.400,00**
- RIGOR MATEMÁTICO: Caso apresente tabelas tributárias (Presumido, Real ou Simples), calcule o IRPJ (15% + 10% sobre excedente de R$ 20.000/mês), CSLL (9%) e confira as somas aritmeticamente.
- LEGISLAÇÃO VIGENTE: Use apenas normas e leis ativas.
- PROIBIÇÃO DE LINKS INVENTADOS: Não gere links falsos.
- LINK OBRIGATÓRIO DE WHATSAPP NO FINAL: O CTA final DEVE direcionar para o WhatsApp oficial da JMF Contabilidade com o número real:
  [Falar com os especialistas da JMF Contabilidade](https://wa.me/554733265123?text=MENSAGEM_URL_ENCODED)
  É EXPRESSAMENTE PROIBIDO usar números fictícios como 999999999, XXXXXXXXX ou placeholders.

LINKS INTERNOS OBRIGATÓRIOS:
`;

  Object.entries(INTERNAL_LINKS).forEach(([key, url]) => {
    if (key !== 'padrao') {
      prompt += `- ${key}: ${url}\n`;
    }
  });
  prompt += `- contato: ${INTERNAL_LINKS.padrao}\n\n`;

  prompt += `FONTES OFICIAIS CITADAS: No rodapé, liste de 3 a 5 normas oficiais vigentes.

---
SEÇÃO INSTAGRAM (adicione no final do arquivo):
<!-- INSTAGRAM_START
LEGENDA PARA POST/CARROSSEL:
[Crie uma legenda engajante para o Instagram da JMF Contabilidade: Gancho nos primeiros 2 segundos + resumo dos pontos principais + chamada para salvar o post e chamar a JMF no link da bio]

ESTRUTURA SUGERIDA DE CARROSSEL (5 SLIDES):
- Slide 1 (Capa): Título chamativo com alerta/urgência
- Slide 2: O que mudou ou qual é o prazo
- Slide 3: Quem é afetado
- Slide 4: O que a sua empresa precisa fazer agora
- Slide 5: Como a JMF Contabilidade ajuda o seu negócio
INSTAGRAM_END -->`;

  if (FORCED_TOPIC) {
    prompt += `\n\nATENÇÃO: O usuário forçou o tema: "${FORCED_TOPIC}". Ignore as notícias e foque exclusivamente neste tema.`;
  }

  return prompt;
}

async function auditPost(rawMarkdown) {
  const auditPrompt = `Você é um Auditor Fiscal e Contador Sênior. Revise o artigo de blog contábil abaixo antes da publicação.

SUAS TAREFAS:
1. Verifique qualquer cálculo de imposto nas tabelas ou textos. Se houver erro de IRPJ, CSLL ou soma errada, corrija os números.
2. Certifique-se de que não haja leis revogadas nem links inventados.
3. ELIMINE QUALQUER NOTAÇÃO LATEX ($$ ou $): Converta equações matemáticas para texto/Markdown simples com negrito (ex: * **Base:** R$ 100 × 10% = R$ 10).
4. VERIFIQUE O NÚMERO DO WHATSAPP: O número oficial deve ser estritamente '554733265123'. Corrija se houver placeholders como '999999999'.
5. Garanta que o frontmatter (title, description, pubDate, author, image) permaneça íntegro.
6. Retorne APENAS o Markdown completo pronto para publicação, sem comentários adicionais.

ARTIGO:
${rawMarkdown}`;

  console.log('🔍 Executando auditoria contábil e fiscal com Gemini...');
  return await generateWithFallback(auditPrompt, 'auditoria');
}

// Remove cercas de código que o modelo às vezes coloca em volta do Markdown
function stripFences(text) {
  return String(text)
    .replace(/^\s*```[a-z]*\s*\r?\n/i, '')
    .replace(/\r?\n```\s*$/, '')
    .trim();
}

// BLINDAGEM PROGRAMÁTICA: Limpa qualquer LaTeX residual ou número falso antes de gravar
function sanitizeMarkdown(md) {
  let clean = md;

  // 1. Corrige números de WhatsApp fictícios
  clean = clean.replace(/wa\.me\/55479[0-9]{8}/g, 'wa.me/554733265123');
  clean = clean.replace(/wa\.me\/5547999999999/g, 'wa.me/554733265123');

  // 2. Remove blocos LaTeX $$ ... $$ convertendo para texto limpo
  clean = clean.replace(/\$\$\\text\{([^}]+)\}\s*=\s*([^$]+)\$\$/g, '* **$1:** $2');
  clean = clean.replace(/\$\$([^$]+)\$\$/g, '$1');
  clean = clean.replace(/\\text\{([^}]+)\}/g, '$1');
  clean = clean.replace(/\\times/g, '×');
  clean = clean.replace(/\\%/g, '%');
  clean = clean.replace(/\\\$/g, 'R$');

  return clean;
}

async function main() {
  const news = await fetchLatestNews();
  const prompt = buildPrompt(news);

  console.log('🤖 Gerando rascunho com base nas notícias...');
  let markdown = stripFences(await generateWithFallback(prompt, 'rascunho'));

  // A auditoria é um "extra": se o Gemini estiver instável, publica o rascunho
  // em vez de perder o post inteiro (era mais uma chance de 503 derrubar o job).
  let cleanMarkdown;
  try {
    cleanMarkdown = stripFences(await auditPost(markdown));
  } catch (err) {
    console.warn(`⚠️ Auditoria não concluída (${err.message}). Publicando o rascunho sem revisão automática.`);
    cleanMarkdown = markdown;
  }

  // Aplica a blindagem por código
  cleanMarkdown = sanitizeMarkdown(cleanMarkdown);

  // Força pubDate correta — o Gemini inventa datas futuras e o filtro
  // pubDate <= now do blog exclui o post do build (404 no site)
  cleanMarkdown = cleanMarkdown.replace(/pubDate:\s*\d{4}-\d{2}-\d{2}/, `pubDate: ${getTodayBR()}`);

  const fmMatch = cleanMarkdown.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) throw new Error('Frontmatter inválido');

  const fm = fmMatch[1];
  const title = fm.match(/title:\s*"([^"]+)"/)?.[1];
  const description = fm.match(/description:\s*"([^"]+)"/)?.[1];
  const pubDate = fm.match(/pubDate:\s*(\d{4}-\d{2}-\d{2})/)?.[1];
  const author = fm.match(/author:\s*"([^"]+)"/)?.[1];
  const image = fm.match(/image:\s*"([^"]+)"/)?.[1];

  if (!title || !description || !pubDate || !author || !image) {
    throw new Error('Campos obrigatórios faltando no frontmatter');
  }

  const slug = path.basename(image, '.webp').replace('blog-', '');
  const existingFile = path.join(BLOG_DIR, `${slug}.md`);
  if (fs.existsSync(existingFile)) {
    throw new Error(`Slug já existe: ${slug}.md`);
  }

  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, cleanMarkdown, 'utf-8');
  console.log(`✅ Post publicado com sucesso: ${filePath}`);

  const postUrl = `https://www.jmfcontabilidade.com.br/blog/${slug}`;
  const postImage = `https://www.jmfcontabilidade.com.br${image}`;

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `title<<EOF\n${title}\nEOF\n`);
    fs.appendFileSync(githubOutput, `summary<<EOF\n${description}\nEOF\n`);
    fs.appendFileSync(githubOutput, `url=${postUrl}\n`);
    fs.appendFileSync(githubOutput, `image=${postImage}\n`);
    fs.appendFileSync(githubOutput, `slug=${slug}\n`);
  }
}

main()
  .then(() => {
    // Rede de segurança: se algum handle ficar pendurado, encerra em 250ms
    // em vez de deixar o job pendurado até o timeout do workflow.
    setTimeout(() => process.exit(0), 250).unref();
  })
  .catch((e) => {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  });
