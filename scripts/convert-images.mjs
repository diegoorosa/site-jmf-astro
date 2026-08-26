/**
 * Converte imagens JPG/PNG para WebP (qualidade 80).
 * Usa sharp (rápido, nativo no Node).
 * Só converte se .webp não existir.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../public/assets/images');

async function convertAll() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log(`⚠️ Diretório não encontrado: ${IMAGES_DIR}`);
    return;
  }

  const files = fs.readdirSync(IMAGES_DIR)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f));

  if (files.length === 0) {
    console.log('✅ Nenhuma imagem JPG/PNG para converter');
    return;
  }

  let converted = 0;
  let skipped = 0;

  for (const file of files) {
    const inputPath = path.join(IMAGES_DIR, file);
    const outputName = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const outputPath = path.join(IMAGES_DIR, outputName);

    if (fs.existsSync(outputPath)) {
      skipped++;
      continue;
    }

    try {
      await sharp(inputPath)
        .webp({ quality: 80, effort: 4 })
        .toFile(outputPath);
      converted++;
      console.log(`✅ ${file} → ${outputName}`);
    } catch (err) {
      console.error(`❌ Falha ao converter ${file}:`, err.message);
    }
  }

  console.log(`\n📊 Conversão concluída: ${converted} convertidas, ${skipped} já existiam`);
}

convertAll().catch(e => {
  console.error('❌ Erro fatal:', e.message);
  process.exit(1);
});