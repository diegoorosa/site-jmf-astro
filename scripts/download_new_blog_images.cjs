const fs = require('fs');
const path = require('path');
const https = require('https');

const images = [
  // INSS de Obra - obra civil, engenheiro, cálculo, SERO
  {
    url: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop',
    filename: 'blog-inss-obra-sero-2026.webp',
    alt: 'Engenheiro e contador revisando cálculo de INSS de obra no SERO da Receita Federal'
  },
  // Exportação Software TI - desenvolvedor, laptop, código, internacional
  {
    url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop',
    filename: 'blog-exportacao-software-ti.webp',
    alt: 'Desenvolvedor trabalhando em exportação de software para o exterior — tributação zero em PIS, COFINS e ISS'
  },
  // Crédito ICMS Diesel Transportadoras - caminhão, posto, logística
  {
    url: 'https://images.pexels.com/photos/164526/pexels-photo-164526.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop',
    filename: 'blog-credito-icms-diesel-transportadoras.webp',
    alt: 'Caminhão em posto de combustível — crédito de ICMS do diesel para transportadoras catarinenses'
  }
];

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        fs.unlink(filepath, () => {});
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  const dir = path.join(__dirname, '..', 'public', 'assets', 'images');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (const img of images) {
    const filepath = path.join(dir, img.filename);
    console.log(`Baixando ${img.filename}...`);
    try {
      await downloadImage(img.url, filepath);
      const stats = fs.statSync(filepath);
      console.log(`✓ ${img.filename} (${(stats.size/1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ ${img.filename}: ${err.message}`);
    }
  }
}

main();