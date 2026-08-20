// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { BETA, SITE } from './src/config/site.js';

/*
 * Garde-fou de bascule bêta → production.
 *
 * `BETA.actif` et `BETA.url` doivent bouger ensemble, et rien dans le code ne
 * le rappelait au moment du build. Laisser `actif` à true en basculant `url`
 * sur le domaine de l'agence livre le site commercial avec `noindex, follow`
 * sur chaque page et un `robots.txt` en `Disallow: /` — un site invisible qui
 * s'affiche parfaitement, donc une panne qu'on ne voit pas avant des semaines.
 *
 * L'erreur est levée au build, pas au démarrage du serveur de développement :
 * c'est la mise en ligne qu'il faut arrêter, pas le travail en cours.
 */
if (BETA.actif && BETA.url === SITE.urlPublique) {
  throw new Error(
    [
      'Configuration incohérente dans src/config/site.js :',
      `  BETA.actif = true et BETA.url = ${BETA.url} (le domaine public).`,
      '',
      "Le build produirait le site de l'agence en noindex, avec un robots.txt",
      'interdisant toute exploration. Pour ouvrir au public, passez',
      'BETA.actif à false — et pensez alors au verrou htpasswd de',
      'public/.htaccess, qui protégeait la bêta.',
    ].join('\n')
  );
}

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
