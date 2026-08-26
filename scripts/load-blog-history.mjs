/**
 * Loads existing blog posts to avoid duplicates.
 * Reads all .md files in src/content/blog/, extracts frontmatter metadata,
 * and returns a JSON object with topics, slugs, and authors for the Gemini prompt.
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

  return { title, description, pubDate, author, image, slug: fileNameToSlug(file) };
}

function fileNameToSlug(filename) {
  const baseName = filename.replace('.md', '');
  return baseName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadBlogHistory() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const fullPath = path.join(BLOG_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const fm = extractFrontmatter(content);

    if (fm) {
      posts.push({
        ...fm,
        slug: fm.slug,
        file
      });
    }
  }

  // Sort by date (newest first)
  posts.sort((a, b) => b.pubDate.localeCompare(a.pubDate));

  // Get last 30 posts for context
  const recentPosts = posts.slice(0, 30);
  const topics = recentPosts.map(p => `- "${p.title}" (${p.pubDate}) — ${p.slug}`);
  const authors = [...new Set(recentPosts.map(p => p.author?.split(',')[0].trim()))].join(', ');

  // Output for GitHub Actions
  const output = {
    topics: recentPosts.map(p => p.title).join('\n'),
    slugs: recentPosts.map(p => p.slug).join(','),
    authors: authors,
    total_posts: posts.length,
    recent_posts: recentPosts.length
  };

  // Write to GitHub Actions output
  process.env.GITHUB_OUTPUT = JSON.stringify({
    topics: output.topics,
    slugs: output.slugs,
    authors: output.authors,
    total_posts: output.total_posts,
    recent_posts: output.recent_posts
  });

  console.log(`📚 Loaded ${posts.length} blog posts (${output.recent_posts} recent for context)`);
  console.log(`Autores detectados: ${output.authors}`);
}

main().catch(e => {
  console.error('Error loading blog history:', e);
  process.exit(1);
});

main();