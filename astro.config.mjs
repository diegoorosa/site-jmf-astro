// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  output: 'static',
  site: 'https://www.jmfcontabilidade.com.br/',
  integrations: [
    sitemap({
      // lastmod global (build time)
      lastmod: new Date(),
      // REMOVIDO: changefreq e priority são tags depreciadas pelo Google
      // serialize permite customizar cada entrada do sitemap individualmente
      serialize: (entry) => {
        // Se é post do blog, tentar ler pubDate do arquivo .md
        if (entry.url.startsWith('/blog/') && !entry.url.endsWith('/blog/')) {
          const slug = entry.url.replace('/blog/', '').replace(/\/$/, '');
          const blogDir = path.join(process.cwd(), 'src/content/blog');
          const files = fs.readdirSync(blogDir);
          const mdFile = files.find(f => f.startsWith(slug + '.') && f.endsWith('.md'));
          if (mdFile) {
            const content = fs.readFileSync(path.join(blogDir, mdFile), 'utf-8');
            const pubDateMatch = content.match(/pubDate:\s*["']?(\d{4}-\d{2}-\d{2})["']?/);
            if (pubDateMatch) {
              return {
                ...entry,
                lastmod: new Date(pubDateMatch[1]),
              };
            }
          }
        }
        // Para páginas estáticas, usar build time
        return {
          ...entry,
          lastmod: new Date(),
        };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
