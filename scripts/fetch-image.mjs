/**
 * Busca imagem no Pexels baseada no slug/tema do post.
 * Salva como WebP em public/assets/images/blog-{slug}.webp
 * Evita imagens duplicadas.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../public/assets/images');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const SLUG = process.env.POST_SLUG || '';
const TITLE = process.env.POST_TITLE || '';

if (!SLUG) {
  console.error('❌ POST_SLUG não definido');
  process.exit(1);
}

const OUTPUT_FILE = path.join(IMAGES_DIR, `blog-${SLUG}.webp`);

// Verificar se já existe
if (fs.existsSync(OUTPUT_FILE)) {
  console.log(`✅ Imagem já existe: ${OUTPUT_FILE}`);
  process.exit(0);
}

// Palavras-chave para busca baseadas no slug/título
function getSearchTerms(slug, title) {
  const terms = [];

  // Extrair palavras do slug
  const slugWords = slug.split('-').filter(w => w.length > 2);
  terms.push(...slugWords);

  // Adicionar termos contextuais baseados em palavras-chave do título
  const titleLower = title.toLowerCase();
  const contextMap = {
    'holding': ['holding familiar', 'business structure', 'corporate governance'],
    'patrimonial': ['asset protection', 'wealth management', 'estate planning'],
    'protecao': ['protection', 'security', 'shield'],
    'bens': ['assets', 'property', 'wealth'],
    'sucessao': ['succession', 'inheritance', 'legacy'],
    'planejamento': ['planning', 'strategy', 'financial planning'],
    'tributario': ['tax planning', 'tax optimization', 'finance'],
    'fiscal': ['tax', 'accounting', 'finance'],
    'trabalhista': ['labor law', 'employment', 'workplace'],
    'esocial': ['digital HR', 'payroll', 'compliance'],
    'simples': ['small business', 'tax simplicity', 'entrepreneurship'],
    'mei': ['microentrepreneur', 'small business', 'startup'],
    'irpf': ['tax return', 'personal finance', 'tax'],
    'abertura': ['business startup', 'company formation', 'entrepreneurship'],
    'contabilidade': ['accounting', 'finance', 'bookkeeping'],
    'blumenau': ['Blumenau Santa Catarina', 'business Brazil', 'corporate'],
    'sc': ['Santa Catarina Brazil', 'southern Brazil', 'business'],
    '2026': ['2026 business', 'modern office', 'future planning'],
  };

  for (const [key, values] of Object.entries(contextMap)) {
    if (titleLower.includes(key) || slug.includes(key)) {
      terms.push(...values);
    }
  }

  // Fallback genérico
  if (terms.length === 0) {
    terms.push('business', 'office', 'finance', 'professional');
  }

  // Remover duplicatas e limitar
  return [...new Set(terms)].slice(0, 5);
}

async function searchPexels(terms) {
  if (!PEXELS_API_KEY) return null;

  const query = terms.join(' ');
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': PEXELS_API_KEY }
    });

    if (!response.ok) {
      console.warn(`⚠️ Pexels API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      // Pegar a primeira foto com boa resolução
      const photo = data.photos.find(p => p.src.large2x || p.src.large || p.src.medium);
      return photo.src.large2x || photo.src.large || photo.src.medium;
    }
  } catch (err) {
    console.warn(`⚠️ Pexels search failed: ${err.message}`);
  }
  return null;
}

async function searchUnsplash(terms) {
  if (!UNSPLASH_ACCESS_KEY) return null;

  const query = terms.join(' ');
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });

    if (!response.ok) {
      console.warn(`⚠️ Unsplash API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const photo = data.results[0];
      return photo.urls.regular || photo.urls.full;
    }
  } catch (err) {
    console.warn(`⚠️ Unsplash search failed: ${err.message}`);
  }
  return null;
}

async function downloadAndConvert(imageUrl, outputPath) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Usar sharp para converter para WebP
    const sharp = (await import('sharp')).default;
    await sharp(buffer)
      .webp({ quality: 80, effort: 4 })
      .resize(1200, 630, { fit: 'cover', position: 'center' }) // 1.91:1 ratio for social
      .toFile(outputPath);

    console.log(`✅ Imagem salva: ${outputPath}`);
    return true;
  } catch (err) {
    console.error(`❌ Falha ao baixar/converter: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`🔍 Buscando imagem para: ${SLUG} (${TITLE})`);

  const terms = getSearchTerms(SLUG, TITLE);
  console.log(`🔑 Termos de busca: ${terms.join(', ')}`);

  let imageUrl = null;

  // Tentar Pexels primeiro
  if (PEXELS_API_KEY) {
    console.log('📸 Tentando Pexels...');
    imageUrl = await searchPexels(terms);
  }

  // Fallback para Unsplash
  if (!imageUrl && UNSPLASH_ACCESS_KEY) {
    console.log('📸 Tentando Unsplash...');
    imageUrl = await searchUnsplash(terms);
  }

  if (!imageUrl) {
    console.error('❌ Nenhuma imagem encontrada ou APIs não configuradas');
    console.log('💡 Configure PEXELS_API_KEY ou UNSPLASH_ACCESS_KEY nos secrets');
    process.exit(1);
  }

  console.log(`🌐 URL da imagem: ${imageUrl}`);

  const success = await downloadAndConvert(imageUrl, OUTPUT_FILE);
  if (!success) process.exit(1);
}

main().catch(e => {
  console.error('❌ Erro fatal:', e.message);
  process.exit(1);
});