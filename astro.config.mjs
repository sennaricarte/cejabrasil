// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://cejabrasil.org.br',
  integrations: [sitemap()],
  redirects: {
    '/estagio': '/empresas/estagio',
    '/vagas/estagio': '/empresas/estagio',
    '/pcd': '/empresas/inclusao-pcd',
    '/vagas/pcd': '/empresas/inclusao-pcd',
  },
  build: {
    inlineStylesheets: 'always'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
