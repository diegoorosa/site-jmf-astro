/**
 * Gera post de blog via Gemini API.
 * Lê histórico de posts (load-blog-history) para evitar duplicatas.
 * Retorna frontmatter + conteúdo, e exporta variáveis para steps seguintes.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const IMAGES_DIR = path.resolve(__dirname, '../public/assets/images');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fallback chain: modelos atuais funcionando
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
      console.warn(`⚠️  Falhou ${modelName}: ${msg.includes('503') ? '503 indisponível' : msg.slice(0, 100)}`);
      if (!msg.includes('503') && !msg.includes('429') && !msg.includes('quota')) {
        // Erro não-retryable (ex: auth, prompt inválido) — não tentar próximo
        throw err;
      }
      // Pequeno delay antes do próximo modelo
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastError;
}

// Tópicos existentes (do step anterior)
const EXISTING_TOPICS = process.env.EXISTING_TOPICS || '';
const FORCED_TOPIC = process.env.FORCED_TOPIC || '';

// Autores válidos (alternar)
const AUTHORS = [
  'Diego Rosa, CRC SC-035810/O',
  'Fabricio Rosa, CRC SC-029833/O'
];

// Internal links por tema
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

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getTodayBR() {
  const now = new Date();
  // Ajustar para horário de Brasília (UTC-3)
  const brTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const day = brTime.getDay(); // 0 = domingo, 6 = sábado
  if (day === 0 || day === 6) {
    // Se fim de semana, usar segunda-feira
    const daysToAdd = day === 0 ? 1 : 2;
    brTime.setDate(brTime.getDate() + daysToAdd);
  }
  return brTime.toISOString().split('T')[0];
}

function pickAuthor(recentAuthors) {
  // Alternar autor: se último foi Diego, usa Fabricio, e vice-versa
  const lastAuthor = recentAuthors[0]?.split(',')[0]?.trim() || '';
  return lastAuthor === 'Diego Rosa' ? AUTHORS[1] : AUTHORS[0];
}

function pickInternalLinks(content, forcedTopic) {
  const links = new Set();
  const lower = content.toLowerCase();

  if (lower.includes('simples') || lower.includes('tributário') || lower.includes('planejamento') || lower.includes('fator r') || lower.includes('lucro presumido') || lower.includes('lucro real')) {
    links.add(INTERNAL_LINKS.tributario);
  }
  if (lower.includes('nota fiscal') || lower.includes('nfs-e') || lower.includes('iss') || lower.includes('fiscal')) {
    links.add(INTERNAL_LINKS.fiscal);
  }
  if (lower.includes('esocial') || lower.includes('det') || lower.includes('trabalhista') || lower.includes('folha') || lower.includes('pessoal')) {
    links.add(INTERNAL_LINKS.pessoal);
  }
  if (lower.includes('fluxo de caixa') || lower.includes('gerencial') || lower.includes('bpo') || lower.includes('holding')) {
    links.add(INTERNAL_LINKS.gerencial);
  }
  if (lower.includes('irpf') || lower.includes('imposto de renda') || lower.includes('pessoa física')) {
    links.add(INTERNAL_LINKS.irpf);
  }
  if (lower.includes('mei') || lower.includes('microempreendedor') || lower.includes('abrir empresa') || lower.includes('abertura')) {
    links.add(INTERNAL_LINKS.mei);
    links.add(INTERNAL_LINKS.regimes);
  }
  if (lower.includes('contador') || lower.includes('contabilidade para')) {
    links.add(INTERNAL_LINKS.contador);
  }

  // Sempre incluir contato
  links.add(INTERNAL_LINKS.padrao);

  return Array.from(links).slice(0, 4); // máx 4 links internos
}

function buildPrompt() {
  const today = getTodayBR();
  const author = pickAuthor([]); // será ajustado depois se houver histórico

  let prompt = `Você é redator sênior da JMF Contabilidade (Blumenau/SC), escritório de contabilidade com foco em tributário, fiscal, pessoal e gestão empresarial.

REGRAS OBRIGATÓRIAS DE FORMATO (retorne APENAS o Markdown completo, sem explicações):

---
title: "Título atrativo, max 70 chars, com palavra-chave principal"
description: "Meta description max 160 chars, call-to-action sutil"
pubDate: ${today}
author: "${author}"
image: "/assets/images/blog-{slug}.webp"
imageAlt: "Descrição visual da imagem para acessibilidade"
---

CONTEÚDO (1500-2500 palavras):
- Estrutura: H2 principais, H3 para subseções
- Tom: profissional, didático, autoridade (E-E-A-T)
- Linguagem: português brasileiro, técnico mas acessível
- Dados: cite fontes oficiais (gov.br, Planalto, Receita Federal, CGSN, CFC)
- Exemplos práticos de Blumenau/SC quando aplicável
- CTA final suave para WhatsApp

LINKS INTERNOS OBRIGATÓRIOS (insira naturalmente no texto + lista no final):
`;

  // Adicionar links internos sugeridos
  Object.entries(INTERNAL_LINKS).forEach(([key, url]) => {
    if (key !== 'padrao') {
      prompt += `- ${key}: ${url}\n`;
    }
  });
  prompt += `- contato: ${INTERNAL_LINKS.padrao}\n\n`;

  prompt += `FONTES: liste 3-5 URLs oficiais no final (formato: - [Título](URL))

---

TÓPICOS JÁ PUBLICADOS (NÃO REPITA):
${EXISTING_TOPICS || '(nenhum histórico disponível)'}

`;

  if (FORCED_TOPIC) {
    prompt += `\nTEMA FORÇADO PELO USUÁRIO: ${FORCED_TOPIC}\nGere artigo especificamente sobre este tema.\n`;
  } else {
    prompt += `\nESCOLHA UM TEMA RELEVANTE PARA AGOSTO/2026 (tributário, fiscal, trabalhista, empreendedorismo).
Sugestões de temas quentes:
- Reforma tributária (IBS/CBS, split payment, transição)
- eSocial / DET / fiscalização trabalhista digital
- Simples Nacional 2026 (tabelas, Fator R, desenquadramento)
- MEI (novo teto, CNPJ alfanumérico, desenquadramento)
- IRPF 2026/2027 (malha fina, prazos, novidades)
- Incentivos fiscais SC/Blumenau
- Certificado digital A1 vs A3
- BPO financeiro para PMEs
- Holding familiar / planejamento sucessório
\n`;
  }

  prompt += `\nIMPORTANTE:
- NÃO repita temas dos últimos 30 posts acima
- Use slug único (baseado no título)
- Data de hoje: ${today} (não use fim de semana)
- Autor: alterne entre Diego Rosa e Fabricio Rosa
- Imagem: use slug do título no caminho /assets/images/blog-{slug}.webp`;

  return prompt;
}

async function main() {
  const prompt = buildPrompt();

  console.log('🤖 Enviando prompt para Gemini...');
  const markdown = await generateWithFallback(prompt);

  // Validar e extrair frontmatter
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) throw new Error('Frontmatter inválido - não encontrado');

  const fm = fmMatch[1];
  const title = fm.match(/title:\s*"([^"]+)"/)?.[1];
  const description = fm.match(/description:\s*"([^"]+)"/)?.[1];
  const pubDate = fm.match(/pubDate:\s*(\d{4}-\d{2}-\d{2})/)?.[1];
  const author = fm.match(/author:\s*"([^"]+)"/)?.[1];
  const image = fm.match(/image:\s*"([^"]+)"/)?.[1];
  const imageAlt = fm.match(/imageAlt:\s*"([^"]+)"/)?.[1];

  if (!title || !description || !pubDate || !author || !image) {
    throw new Error('Campos obrigatórios faltando no frontmatter');
  }

  const slug = path.basename(image, '.webp').replace('blog-', '');
  const expectedSlug = slugify(title);

  // Verificar duplicata por slug
  const existingFile = path.join(BLOG_DIR, `${slug}.md`);
  if (fs.existsSync(existingFile)) {
    throw new Error(`Slug já existe: ${slug}.md`);
  }

  // Salvar post
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, markdown, 'utf-8');
  console.log(`✅ Post salvo: ${filePath}`);

  // Preparar URLs para GMB
  const postUrl = `https://www.jmfcontabilidade.com.br/blog/${slug}`;
  const postImage = `https://www.jmfcontabilidade.com.br${image}`;

  // Exportar para GitHub Actions outputs
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `title<<EOF\n${title}\nEOF\n`);
    fs.appendFileSync(githubOutput, `summary<<EOF\n${description}\nEOF\n`);
    fs.appendFileSync(githubOutput, `url=${postUrl}\n`);
    fs.appendFileSync(githubOutput, `image=${postImage}\n`);
    fs.appendFileSync(githubOutput, `slug=${slug}\n`);
  }

  console.log(`📝 Título: ${title}`);
  console.log(`🔗 URL: ${postUrl}`);
  console.log(`🖼️  Imagem: ${postImage}`);
  console.log(`👤 Autor: ${author}`);
  console.log(`📅 Data: ${pubDate}`);
}

main().catch(e => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
});
