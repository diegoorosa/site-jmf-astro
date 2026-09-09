/**
 * Busca imagem no Pexels/Unsplash baseada no tema contábil/empresarial do post.
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

// Mapeador semântico: Converte termos contábeis/fiscais em buscas corporativas em INGLÊS
function getSearchTerms(slug, title) {
  const text = `${slug} ${title}`.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const terms = [];

  // Mapeamento temático estrito para o ecossistema contábil e corporativo
  const THEME_MAP = [
    // 1. Tributário / Reforma / IBS / CBS / Planejamento Fiscal
    {
      keywords: ['ibs', 'cbs', 'reforma', 'tribut', 'imposto', 'planejamento', 'presumido', 'lucro real'],
      queries: [
        'corporate tax financial planning',
        'business strategy meeting finance',
        'financial analysis documents office',
        'corporate accounting calculation'
      ]
    },
    // 2. Simples Nacional / DAS / PGDAS / Dívidas
    {
      keywords: ['simples', 'das', 'pgdas', 'parcelamento', 'receita', 'fator r'],
      queries: [
        'accounting office spreadsheet calculator',
        'small business financial paperwork',
        'modern finance office paperwork desk'
      ]
    },
    // 3. MEI / Desenquadramento / Faturamento
    {
      keywords: ['mei', 'desenquadr', 'faturamento', 'excesso'],
      queries: [
        'small business owner modern office',
        'entrepreneur reviewing business finance',
        'business growth planning laptop desk'
      ]
    },
    // 4. Abertura de Empresa / Viabilidade / Custos / JUCESC
    {
      keywords: ['abrir', 'abertura', 'custa', 'custo', 'taxa', 'jucesc', 'viabilidade', 'sociedade', 'contrato'],
      queries: [
        'corporate business contract signing desk',
        'business partners consultation office',
        'entrepreneur starting new company office'
      ]
    },
    // 5. Alvará / Vigilância Sanitária (VISA) / Licenças
    {
      keywords: ['alvara', 'visa', 'sanitar', 'localizacao', 'prefeitura', 'vistoria', 'imovel'],
      queries: [
        'architectural blueprint commercial office',
        'modern corporate business facility desk',
        'business compliance documentation meeting'
      ]
    },
    // 6. Sucessão / Holding / Sócios / Patrimônio
    {
      keywords: ['holding', 'patrimon', 'sucess', 'bens', 'socio'],
      queries: [
        'corporate boardroom executive meeting',
        'modern corporate architecture skyscraper',
        'executive handshake business agreement'
      ]
    },
    // 7. Trabalhista / eSocial / Folha / RH
    {
      keywords: ['trabalh', 'esocial', 'folha', 'pessoal', 'rh', 'salario'],
      queries: [
        'human resources corporate team meeting',
        'professional modern workplace business staff'
      ]
    }
  ];

  // Adicionar buscas dos temas identificados
  for (const theme of THEME_MAP) {
    if (theme.keywords.some(kw => text.includes(kw))) {
      terms.push(...theme.queries);
    }
  }

  // Fallback corporativo garantido (se o tema for muito específico)
  const CORPORATE_FALLBACKS = [
    'modern corporate accounting office',
    'business executives financial meeting',
    'financial report analysis office desk',
    'corporate business meeting boardroom'
  ];

  terms.push(...CORPORATE_FALLBACKS);

  // Remove duplicados preservando a prioridade dos temas mais relevantes
  return [...new Set(terms)].slice(0, 5);
}

async function searchPexels(terms) {
  if (!PEXELS_API_KEY) return null;

  for (const term of terms) {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=10&orientation=landscape`;

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': PEXELS_API_KEY }
      });

      if (!response.ok) {
        console.warn(`⚠️ Pexels API error (${term}): ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        const photo = data.photos.find(p => p.src.original || p.src.large2x || p.src.large || p.src.medium);
        if (photo) {
          console.log(`✅ Pexels encontrou com termo corporativo: "${term}"`);
          return {
            original: photo.src.original,
            large2x: photo.src.large2x,
            large: photo.src.large,
            medium: photo.src.medium
          };
        }
      }
      console.log(`⚪ Pexels sem resultados para: "${term}"`);
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

      if (!response.ok) {
        console.warn(`⚠️ Unsplash API error (${term}): ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const photo = data.results[0];
        console.log(`✅ Unsplash encontrou com termo corporativo: "${term}"`);
        return {
          original: photo.urls.raw || photo.urls.full,
          regular: photo.urls.regular,
          full: photo.urls.full
        };
      }
      console.log(`⚪ Unsplash sem resultados para: "${term}"`);
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

    if (!originalUrl || !webpUrl) {
      throw new Error('URLs de imagem não encontradas');
    }

    console.log(`🌐 URL original: ${originalUrl}`);
    console.log(`🌐 URL WebP: ${webpUrl}`);

    const origResponse = await fetch(originalUrl);
    if (!origResponse.ok) throw new Error(`HTTP ${origResponse.status} (original)`);
    const origBuffer = Buffer.from(await origResponse.arrayBuffer());

    const origImage = sharp(origBuffer);
    const origMetadata = await origImage.metadata();
    console.log(`📐 Original: ${origMetadata.width}x${origMetadata.height}`);

    let origToSave = origImage;
    if (origMetadata.width > 10000 || origMetadata.height > 10000) {
      console.log(`⚠️ Redimensionando original (máx 10000px)...`);
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
  console.log(`🔍 Buscando imagem corporativa para: ${SLUG} (${TITLE})`);

  const terms = getSearchTerms(SLUG, TITLE);
  console.log(`🔑 Termos de busca prioritários: ${terms.join(' | ')}`);

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
    process.exit(1);
  }

  const urls = await downloadAndSave(imageInfo, WEBP_FILE, ORIGINAL_FILE);
  if (!urls) process.exit(1);

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
