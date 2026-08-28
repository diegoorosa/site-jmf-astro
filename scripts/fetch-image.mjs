/**
 * Busca imagem no Pexels/Unsplash baseada no slug/tema do post.
 * Salva: WebP para o site + original (JPG/PNG) para GMB.
 * Exporta URLs originais para GitHub Actions.
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

const WEBP_FILE = path.join(IMAGES_DIR, `blog-${SLUG}.webp`);
const ORIGINAL_FILE = path.join(IMAGES_DIR, `blog-${SLUG}.orig.jpg`);

// Verificar se já existe
if (fs.existsSync(WEBP_FILE)) {
  console.log(`✅ Imagens já existem: ${WEBP_FILE}`);
  process.exit(0);
}

// Palavras-chave para busca baseadas no slug/título
function getSearchTerms(slug, title) {
  const terms = [];

  const slugWords = slug.split('-').filter(w => w.length > 2);
  terms.push(...slugWords);

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

  if (terms.length === 0) {
    terms.push('business', 'office', 'finance', 'professional');
  }

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
      const photo = data.photos.find(p => p.src.original || p.src.large2x || p.src.large || p.src.medium);
      return {
        original: photo.src.original,
        large2x: photo.src.large2x,
        large: photo.src.large,
        medium: photo.src.medium
      };
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
      return {
        original: photo.urls.raw || photo.urls.full,
        regular: photo.urls.regular,
        full: photo.urls.full
      };
    }
  } catch (err) {
    console.warn(`⚠️ Unsplash search failed: ${err.message}`);
  }
  return null;
}

async function downloadAndSave(imageInfo, webpPath, originalPath) {
  try {
    const sharp = (await import('sharp')).default;

    // Preferir original para GMB, maior disponível para WebP
    const originalUrl = imageInfo.original || imageInfo.large2x || imageInfo.large || imageInfo.regular || imageInfo.full || imageInfo.medium;
    const webpUrl = imageInfo.large2x || imageInfo.large || imageInfo.regular || imageInfo.full || imageInfo.medium || imageInfo.original;

    if (!originalUrl || !webpUrl) {
      throw new Error('URLs de imagem não encontradas');
    }

    console.log(`🌐 URL original: ${originalUrl}`);
    console.log(`🌐 URL WebP: ${webpUrl}`);

    // Baixar original
    const origResponse = await fetch(originalUrl);
    if (!origResponse.ok) throw new Error(`HTTP ${origResponse.status} (original)`);
    const origBuffer = Buffer.from(await origResponse.arrayBuffer());

    // Processar original: limitar a 10000x10000 e salvar como JPG (GMB)
    const origImage = sharp(origBuffer);
    const origMetadata = await origImage.metadata();
    console.log(`📐 Original: ${origMetadata.width}x${origMetadata.height}`);

    let origToSave = origImage;
    if (origMetadata.width > 10000 || origMetadata.height > 10000) {
      console.log(`⚠️ Redimensionando original (máx 10000px)...`);
      origToSave = origImage.resize(10000, 10000, { fit: 'inside', withoutEnlargement: true });
    }
    // Sempre salvar como JPG (formato aceito pelo GMB)
    await origToSave
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(originalPath);
    console.log(`✅ Original (JPG) salvo: ${originalPath}`);

    // Baixar e converter para WebP (para site)
    const webpResponse = await fetch(webpUrl);
    if (!webpResponse.ok) throw new Error(`HTTP ${webpResponse.status} (webp)`);
    const webpBuffer = Buffer.from(await webpResponse.arrayBuffer());

    await sharp(webpBuffer)
      .webp({ quality: 80, effort: 4 })
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .toFile(webpPath);
    console.log(`✅ WebP salvo: ${webpPath}`);

    const publicOriginalUrl = `https://www.jmfcontabilidade.com.br/assets/images/blog-${SLUG}.orig.jpg`;
    const publicWebpUrl = `https://www.jmfcontabilidade.com.br/assets/images/blog-${SLUG}.webp`;

    return { originalUrl: publicOriginalUrl, webpUrl: publicWebpUrl };
  } catch (err) {
    console.error(`❌ Falha ao baixar/salvar: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log(`🔍 Buscando imagem para: ${SLUG} (${TITLE})`);

  const terms = getSearchTerms(SLUG, TITLE);
  console.log(`🔑 Termos de busca: ${terms.join(', ')}`);

  let imageInfo = null;

  if (PEXELS_API_KEY) {
    console.log('📸 Tentando Pexels...');
    imageInfo = await searchPexels(terms);
  }

  if (!imageInfo && UNSPLASH_ACCESS_KEY) {
    console.log('📸 Tentando Unsplash...');
    imageInfo = await searchUnsplash(terms);
  }

  if (!imageInfo) {
    console.error('❌ Nenhuma imagem encontrada ou APIs não configuradas');
    console.log('💡 Configure PEXELS_API_KEY ou UNSPLASH_ACCESS_KEY nos secrets');
    process.exit(1);
  }

  const urls = await downloadAndSave(imageInfo, WEBP_FILE, ORIGINAL_FILE);
  if (!urls) process.exit(1);

  // Exportar URLs para GitHub Actions
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `image_original=${urls.originalUrl}\n`);
    fs.appendFileSync(githubOutput, `image_webp=${urls.webpUrl}\n`);
  }

  console.log(`📤 GMB image: ${urls.originalUrl}`);
  console.log(`📤 Site image: ${urls.webpUrl}`);
}

main().catch(e => {
  console.error('❌ Erro fatal:', e.message);
  process.exit(1);
});