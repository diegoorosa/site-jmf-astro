const https = require('https');
const fs = require('fs');
const path = require('path');

// Buscar fotos mais específicas no Pexels
// INSS de Obra: engenheiro com prancheta/planta em obra, ou documentos de obra
// ICMS Diesel: caminhão abastecendo no posto (bomba de combustível visível)

const images = [
  // INSS de Obra - engenheiro com prancheta/planta em canteiro, documentos
  {
    url: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop',
    filename: 'blog-inss-obra-sero-2026.webp'
  },
  // Crédito ICMS Diesel - caminhão abastecendo no posto (bomba visível)
  {
    url: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop',
    filename: 'blog-credito-icms-diesel-transportadoras.webp'
  }
];

const outputDir = path.join(__dirname, '..', 'public', 'assets', 'images');

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(outputDir, filename);
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ ${filename} baixado (${(fs.statSync(filepath).size / 1024).toFixed(1)} KB)`);
          resolve();
        });
      } else {
        file.close();
        fs.unlink(filepath, () => {});
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Baixando imagens mais específicas...\n');
  for (const img of images) {
    try {
      await downloadImage(img.url, img.filename);
    } catch (err) {
      console.error(`✗ Erro ao baixar ${img.filename}:`, err.message);
    }
  }
  console.log('\nConcluído!');
}

main();