// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { SITE } from './src/config/site.js';

export default defineConfig({
  site: SITE.url,
  trailingSlash: 'never',
  build: {
    /*
     * `directory` produit /contact/index.html au lieu de /contact.html.
     *
     * Netlify sert les fichiers plats aux URL propres automatiquement ; Apache,
     * qui est ce que fait tourner un hébergement mutualisé OVH, ne le fait pas.
     * En `file`, l'adresse /contact renvoie un 404 alors que les canonical, le
     * sitemap et la navigation pointent tous dessus.
     *
     * `directory` fonctionne nativement partout, via DirectoryIndex.
     */
    format: 'directory',
    // Astro inline les petites feuilles de style par défaut, ce qui obligerait
    // à ouvrir style-src à 'unsafe-inline'. On préfère garder la CSP stricte.
    inlineStylesheets: 'never',
  },
  integrations: [
    sitemap({
      // Doit rester aligné sur les pages marquées `noindex` dans les templates :
      // une page à la fois noindex et présente au sitemap envoie deux signaux
      // contradictoires à Google.
      filter: (page) => !/\/(mentions-legales|merci)\b/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
