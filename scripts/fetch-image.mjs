/**
 * Busca imagem no Pexels/Unsplash usando termos visuais gerados pelo Gemini.
 * Salva: WebP para o site + original (JPG) para GMB.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../public/assets/images');
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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

if (fs.existsSync(WEBP_FILE)) {
  console.log(`✅ Imagens já existem: ${WEBP_FILE}`);
  process.exit(0);
}

// Pede ao Gemini termos de busca visuais em inglês com base no conteúdo real
async function getVisualSearchTermsWithGemini(slug, title) {
  const fallbackTerms = [
    'modern accounting office finance desk',
    'business executives strategy meeting',
    'financial report data calculation office'
  ];

  if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY não encontrada em fetch-image. Usando fallbacks.');
    return fallbackTerms;
  }

  // Tentar ler o conteúdo do post gerado
  let postContent = '';
  const postPath = path.join(BLOG_DIR, `${slug}.md`);
  if (fs.existsSync(postPath)) {
    postContent = fs.readFileSync(postPath, 'utf-8').slice(0, 1500); // primeiros 1500 caracteres
  }

  const prompt = `You are a creative photo editor for a high-end corporate business and accounting blog.
Analyze this blog post title and content:
TITLE: "${title}"
EXCERPT:
${postContent}

GOAL:
Provide 4 distinct, high-quality stock photo search queries in ENGLISH to find realistic, professional photography on Pexels and Unsplash.

RULES:
1. Identify the specific INDUSTRY, PROFESSION, or ACTIVITY mentioned in the text (e.g., civil construction engineering, modern medical clinic, artisan bakery chef, textile factory manufacturing, corporate board meeting, software developer, small business retail store).
2. If it's pure corporate tax/accounting with no specific industry, use corporate finance scenes (e.g., 'financial audit team meeting office', 'business handshake contract desk').
3. NEVER return terms related to home bedrooms, beds, domestic living, or generic concepts like "option" or "choice".
4. Return ONLY a JSON array with 4 string queries. No markdown, no commentary.

Example output:
["civil engineer construction site building", "architect reading blueprints project", "modern building construction workers", "construction management office"]`;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Limpar markdown se vier formatado como ```json
    const cleanJson = responseText.replace(/^```json\n/, '').replace(/^```\n/, '').replace(/\n```$/, '').trim();
    const terms = JSON.parse(cleanJson);

    if (Array.isArray(terms) && terms.length > 0) {
      console.log('🤖 Gemini gerou termos de busca visuais:');
      terms.forEach((t, i) => console.log(`   ${i + 1}. "${t}"`));
      return terms;
    }
  } catch (err) {
    console.warn(`⚠️ Erro ao consultar Gemini para termos de imagem: ${err.message}`);
  }

  return fallbackTerms;
}

async function searchPexels(terms) {
  if (!PEXELS_API_KEY) return null;

  for (const term of terms) {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=10&orientation=landscape`;

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': PEXELS_API_KEY }
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        const photo = data.photos.find(p => p.src.original || p.src.large2x || p.src.large || p.src.medium);
        if (photo) {
          console.log(`✅ Pexels encontrou com: "${term}"`);
          return {
            original: photo.src.original,
            large2x: photo.src.large2x,
            large: photo.src.large,
            medium: photo.src.medium
          };
        }
      }
    } catch (err) {
      console.warn(`⚠️ Pexels search failed (${term}): ${err.message}`);
    }
  }
  return null;
}

async function searchUnsplash(terms) {
  if (!UNSPLASH_ACCESS_KEY) return null;

  for (const term of terms) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=10&orientation=landscape`;

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const photo = data.results[0];
        console.log(`✅ Unsplash encontrou com: "${term}"`);
        return {
          original: photo.urls.raw || photo.urls.full,
          regular: photo.urls.regular,
          full: photo.urls.full
        };
      }
    } catch (err) {
      console.warn(`⚠️ Unsplash search failed (${term}): ${err.message}`);
    }
  }
  return null;
}

async function downloadAndSave(imageInfo, webpPath, originalPath) {
  try {
    const sharp = (await import('sharp')).default;

    const originalUrl = imageInfo.original || imageInfo.large2x || imageInfo.large || imageInfo.regular || imageInfo.full || imageInfo.medium;
    const webpUrl = imageInfo.large2x || imageInfo.large || imageInfo.regular || imageInfo.full || imageInfo.medium || imageInfo.original;

    if (!originalUrl || !webpUrl) throw new Error('URLs de imagem não encontradas');

    const origResponse = await fetch(originalUrl);
    if (!origResponse.ok) throw new Error(`HTTP ${origResponse.status} (original)`);
    const origBuffer = Buffer.from(await origResponse.arrayBuffer());

    const origImage = sharp(origBuffer);
    const origMetadata = await origImage.metadata();

    let origToSave = origImage;
    if (origMetadata.width > 10000 || origMetadata.height > 10000) {
      origToSave = origImage.resize(10000, 10000, { fit: 'inside', withoutEnlargement: true });
    }

    await origToSave
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(originalPath);
    console.log(`✅ Original (JPG) salvo: ${originalPath}`);

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
  console.log(`🔍 Iniciando busca inteligente de imagem para: ${SLUG}`);

  // Pede os 4 termos contextuais ao Gemini com base no post
  const terms = await getVisualSearchTermsWithGemini(SLUG, TITLE);

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
    console.error('❌ Nenhuma imagem encontrada nas APIs');
    process.exit(1);
  }

  const urls = await downloadAndSave(imageInfo, WEBP_FILE, ORIGINAL_FILE);
  if (!urls) process.exit(1);

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `image_original=${urls.originalUrl}\n`);
    fs.appendFileSync(githubOutput, `image_webp=${urls.webpUrl}\n`);
  }

  console.log(`📤 Imagem final pronta para publicação: ${urls.webpUrl}`);
}

main().catch(e => {
  console.error('❌ Erro fatal:', e.message);
  process.exit(1);
});
