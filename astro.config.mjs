// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: 'https://www.jmfcontabilidade.com.br',
  vite: {
    plugins: [tailwindcss()],
  },
});
