/**
 * Carrega histórico de posts existentes para evitar duplicatas.
 * Gera lista de títulos, slugs e temas para o prompt do Gemini.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = match[1];
  const title = fm.match(/title:\s*"([^"]+)"/)?.[1] || '';
  const description = fm.match(/description:\s*"([^"]+)"/)?.[1] || '';
  const pubDate = fm.match(/pubDate:\s*(\d{4}-\d{2}-\d{2})/)?.[1] || '';
  const author = fm.match(/author:\s*"([^"]+)"/)?.[1] || '';
  const image = fm.match(/image:\s*"([^"]+)"/)?.[1] || '';
  return { title, description, pubDate, author, image };
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function main() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

  const posts = files.map(file => {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const fm = extractFrontmatter(content);
    const slug = file.replace('.md', '');
    return { ...fm, slug, file };
  }).filter(p => p.title).sort((a, b) => b.pubDate.localeCompare(a.pubDate));

  // Preparar saída compacta pro Gemini (últimos 30 posts)
  const recent = posts.slice(0, 30);
  const topics = recent.map(p => `- "${p.title}" (${p.pubDate}) — ${p.slug}`).join('\n');
  const slugs = recent.map(p => p.slug).join(',');
  const authors = [...new Set(recent.map(p => p.author.split(',')[0].trim()))].join(', ');

  // Output para GitHub Actions
  const output = `TOPICS<<EOF
${topics}
EOF
SLUGS=${slugs}
AUTHORS=${authors}
TOTAL_POSTS=${posts.length}
`;

  fs.writeFileSync(process.env.GITHUB_OUTPUT, output);
  console.log(`📚 Histórico carregado: ${posts.length} posts total, ${recent.length} recentes para contexto`);
  console.log(`Autores detectados: ${authors}`);
}

main().catch(e => { console.error(e); process.exit(1); });