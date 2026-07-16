// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://cejabrasil.org.br',
  integrations: [sitemap()],
  redirects: {
    '/estagio': '/vagas/estagio',
    '/pcd': '/vagas/pcd',
  },
  build: {
    inlineStylesheets: 'always'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
