/**
 * Loads existing blog posts to avoid duplicates.
 * Reads all .md files in src/content/blog/, extracts frontmatter metadata,
 * and returns a JSON object with topics, slugs, and authors for the Gemini prompt.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BLOG_DIR = process.env.GITHUB_WORKSPACE
  ? `${process.env.GITHUB_WORKSPACE}/src/content/blog`
  : 'src/content/blog';

function extractFrontmatter(content, file) {
  // Remove BOM if present
  const cleanContent = content.replace(/^﻿/, '');
  const match = cleanContent.match(/^---\n([\s\S]*?)\n---/);
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
    const fm = extractFrontmatter(content, file);

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

  // Write to GitHub Actions output file
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `topics<<EOF\n${output.topics}\nEOF\n`);
    fs.appendFileSync(githubOutput, `slugs=${output.slugs}\n`);
    fs.appendFileSync(githubOutput, `authors=${output.authors}\n`);
    fs.appendFileSync(githubOutput, `total_posts=${output.total_posts}\n`);
    fs.appendFileSync(githubOutput, `recent_posts=${output.recent_posts}\n`);
  }

  console.log(`📚 Loaded ${posts.length} blog posts (${output.recent_posts} recent for context)`);
  console.log(`Autores detectados: ${output.authors}`);
}

function main() {
  loadBlogHistory();
}

main();