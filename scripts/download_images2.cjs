const fs = require('fs');
const path = require('path');
const https = require('https');

const images = [
  // TTD 409 - Porto Itajaí/Navegantes/container - trying different IDs
  {
    url: 'https://images.pexels.com/photos/210209/pexels-photo-210209.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop',
    filename: 'blog-ttd-409-sc.webp',
    alt: 'Porto de Itajaí e Navegantes — complexo portuário catarinense para importação com TTD 409'
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
