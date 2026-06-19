// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  redirects: {
    '/estagio': '/vagas/estagio',
    '/pcd': '/vagas/pcd',
  },
  vite: {
    plugins: [tailwindcss()]
  }
});