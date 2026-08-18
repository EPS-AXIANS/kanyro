import { SITE, BETA } from '../config/site.js';

/**
 * robots.txt généré, et non plus posé en dur dans public/.
 *
 * Il doit suivre `BETA.actif` : un fichier statique aurait continué à inviter
 * Google à explorer pendant que la bêta tourne sur le domaine personnel, et
 * c'est exactement ce qu'on veut éviter. Le générer garantit qu'il ne peut pas
 * se désynchroniser de la configuration.
 *
 * Note sur `/merci` : la page porte déjà `noindex` et le sitemap l'exclut. On ne
 * la met PAS en `Disallow` — un robot qui n'a pas le droit d'explorer une page
 * ne peut pas y lire le `noindex`, si bien que les deux directives s'annulent au
 * lieu de s'additionner. Le `noindex` seul est le signal le plus fort.
 */
export function GET() {
  const corps = BETA.actif
    ? [
        '# Bêta sur domaine personnel — exploration interdite.',
        '# Le site public ouvrira sur ' + SITE.urlPublique + '.',
        '# Voir BETA dans src/config/site.js.',
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        'Sitemap: ' + SITE.url + '/sitemap-index.xml',
        '',
      ].join('\n');

  return new Response(corps, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
