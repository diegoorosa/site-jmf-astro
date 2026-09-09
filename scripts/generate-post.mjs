import { GoogleGenerativeAI } from '@google/generative-ai';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const rssParser = new Parser({ timeout: 5000 });

// FEEDS DE NOTÍCIAS OFICIAIS E CONTÁBEIS
const RSS_FEEDS = [
  'https://www.portalcontnews.com.br/feed/',
  'https://www.contabeis.com.br/rss/noticias/',
  'https://www.jornalcontabil.com.br/feed/',
  'https://noticias.cfc.org.br/feed/'
];

const MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite'
];

async function generateWithFallback(prompt) {
  let lastError;
  for (const modelName of MODELS) {
    try {
      console.log(`🤖 Tentando modelo: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      console.log(`✅ Sucesso com ${modelName}`);
      return result.response.text().trim();
    } catch (err) {
      lastError = err;
      const msg = err.message || String(err);
      console.warn(`⚠️ Falhou ${modelName}: ${msg.includes('503') ? '503 indisponível' : msg.slice(0, 100)}`);
      if (!msg.includes('503') && !msg.includes('429') && !msg.includes('quota')) {
        throw err;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastError;
}

async function fetchLatestNews() {
  console.log('📡 Rastreando notícias contábeis e fiscais recentes...');
  const newsItems = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await rssParser.parseURL(feedUrl);
      feed.items.slice(0, 6).forEach(item => {
        if (item.title) {
          newsItems.push({
            title: item.title,
            snippet: (item.contentSnippet || item.content || '').slice(0, 200),
            link: item.link || ''
          });
        }
      });
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
  return await generateWithFallback(auditPrompt);
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
  let markdown = await generateWithFallback(prompt);
  markdown = markdown.replace(/^```markdown\n/, '').replace(/\n```$/, '');

  const auditedMarkdown = await auditPost(markdown);
  let cleanMarkdown = auditedMarkdown.replace(/^```markdown\n/, '').replace(/\n```$/, '');

  // Aplica a blindagem por código
  cleanMarkdown = sanitizeMarkdown(cleanMarkdown);

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

main().catch(e => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
});
