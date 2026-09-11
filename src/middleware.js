import { defineMiddleware } from 'astro:middleware';

/**
 * La typographie française, posée sur le HTML rendu de chaque page.
 *
 * ---- Pourquoi ici, et pas dans les textes ----
 *
 * Le site n'avait aucune espace insécable : 18 espaces ordinaires avant ? ! : ;
 * sur l'accueil seul, et un « ? » en début de ligne dans la carte « Vos
 * chantiers en photo ». Les montants se coupaient au milieu (« 1 » en fin de
 * ligne, « 900 € » au début de la suivante), « 1 à 2 / semaines » aussi, et
 * les apostrophes étaient droites ou typographiques selon le fichier.
 *
 * Les textes vivent dans une vingtaine de fichiers, des composants aux
 * données, et chaque nouveau texte aurait réintroduit le défaut. Le middleware
 * s'exécute à la génération de chaque page (et en développement) : il corrige
 * tout ce qui est écrit, et tout ce qui le sera.
 *
 * ---- Ce qu'il touche, et ce qu'il ne touche jamais ----
 *
 * Seulement le TEXTE entre les balises. Jamais les balises elles-mêmes ni leurs
 * attributs (classes, liens, alt), jamais le contenu de <script> (le JSON-LD
 * garde ses espaces ordinaires), de <style>, de <textarea>, de <pre> ni de
 * <code>.
 *
 * ---- Les règles ----
 *
 *   ? ! ;   espace fine insécable (U+202F) avant, à la place de l'espace
 *   :       espace insécable (U+00A0) avant
 *   « »     espace insécable à l'intérieur des guillemets
 *   1 900   espace fine insécable entre les milliers
 *   3 €     espace insécable entre un nombre et €, % ou une unité courante
 *           (semaines, jours, heures, minutes, mois, ans, pages, places…)
 *   l'art   apostrophe typographique entre deux lettres
 *
 * Aucune règle n'ajoute ni ne retire de tiret : la consigne du propriétaire
 * (aucun tiret en milieu de phrase) reste une affaire de rédaction.
 */

const FINE = ' ';
const INSECABLE = ' ';
const LETTRE = 'A-Za-zÀ-ÖØ-öø-ÿŒœ';
const UNITES =
  'semaines?|jours?|heures?|minutes?|mois|ans?|années?|pages?|places?|chantiers?|séries?|caractères?|photos?|Ko|Mo|px';

const REGLES = [
  // Apostrophe droite (ou son entité) entre deux lettres.
  [new RegExp(`(?<=[${LETTRE}])(?:'|&#39;|&apos;)(?=[${LETTRE}])`, 'g'), '’'],
  // Guillemets français.
  [/«[ \t\n]+/g, `«${INSECABLE}`],
  [/[ \t\n]+»/g, `${INSECABLE}»`],
  // Ponctuation haute.
  [/[ \t\n]+([?!;])/g, `${FINE}$1`],
  [/[ \t\n]+:(?=[\s<]|$)/g, `${INSECABLE}:`],
  // Milliers : « 1 900 », « 12 000 ».
  [/(\d)[ \t](?=\d{3}(?!\d))/g, `$1${FINE}`],
  // Un nombre et son unité ne se séparent pas.
  [/(\d)[ \t]+(?=[€%])/g, `$1${INSECABLE}`],
  [new RegExp(`(\\d)[ \\t]+(?=(?:${UNITES})(?![${LETTRE}]))`, 'g'), `$1${INSECABLE}`],
];

/** Balises dont le contenu n'est pas du texte à composer. */
const PROTEGEES = /^<(script|style|textarea|pre|code)\b/i;

export function typographier(html) {
  const morceaux = html.split(/(<[^>]+>)/);
  let fermeture = null;

  for (let i = 0; i < morceaux.length; i++) {
    const morceau = morceaux[i];
    if (morceau.startsWith('<')) {
      if (fermeture) {
        if (morceau.toLowerCase().startsWith(fermeture)) fermeture = null;
      } else {
        const protegee = morceau.match(PROTEGEES);
        if (protegee && !morceau.endsWith('/>')) fermeture = `</${protegee[1].toLowerCase()}`;
      }
      continue;
    }
    if (fermeture || !morceau.trim()) continue;

    let texte = morceau;
    for (const [motif, remplacement] of REGLES) texte = texte.replace(motif, remplacement);
    morceaux[i] = texte;
  }

  return morceaux.join('');
}

export const onRequest = defineMiddleware(async (_contexte, suivant) => {
  const reponse = await suivant();
  if (!(reponse.headers.get('content-type') ?? '').includes('text/html')) return reponse;

  const html = await reponse.text();
  return new Response(typographier(html), {
    status: reponse.status,
    statusText: reponse.statusText,
    headers: reponse.headers,
  });
});
