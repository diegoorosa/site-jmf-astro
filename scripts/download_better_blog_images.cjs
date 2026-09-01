const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
  // INSS de Obra - engenheiro/arquiteto com plantas/blueprint em obra
  {
    url: 'https://images.pexels.com/photos/1107717/pexels-photo-1107717.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop',
    filename: 'blog-inss-obra-sero-2026.webp'
  },
  // Exportação Software - dev trabalhando em código/notebook (já está ok, manter)
  // Crédito ICMS Diesel Transportadoras - caminhão em posto ou frota
  {
    url: 'https://images.pexels.com/photos/164526/pexels-photo-164526.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop',
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
  console.log('Baixando imagens melhores para os posts do blog...\n');
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