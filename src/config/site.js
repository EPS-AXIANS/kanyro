/**
 * Source unique de vérité pour tout ce qui identifie l'agence.
 *
 * Le nom n'est pas encore déposé à l'INPI (recherche d'antériorité classes 35/42
 * en cours). Tout est centralisé ici pour qu'un changement de nom se répercute
 * partout sans chasse au texte en dur.
 */
/**
 * Bêta sur le domaine personnel.
 *
 * Le site tourne sur elio-pallois.fr le temps des essais. Deux conséquences, et
 * la seconde est celle qui coûte cher si on l'oublie :
 *
 *   1. Le canonical, og:url et le sitemap doivent annoncer l'adresse RÉELLEMENT
 *      servie. Annoncer www.kanyro.fr depuis un autre domaine, c'est dire à
 *      Google d'aller indexer une adresse qui ne répond pas.
 *   2. La bêta doit rester hors de l'index. Sans ça, Google référence le site sur
 *      elio-pallois.fr, et le jour de l'ouverture kanyro.fr publie un contenu
 *      déjà connu ailleurs : au mieux la notoriété acquise reste sur le mauvais
 *      domaine, au pire les deux se font concurrence.
 *
 * `actif: false` bascule tout d'un coup — URL, canonical, sitemap, robots.txt et
 * la balise noindex de chaque page — le jour de l'ouverture commerciale.
 *
 * ⚠ `url` doit être un SOUS-DOMAINE, pas un sous-dossier. Le site génère des
 * chemins absolus (/_astro/…, /contact.php, /merci) et le .htaccess se pose à la
 * racine : servi depuis elio-pallois.fr/kanyro, rien ne se charge.
 */
export const BETA = {
  actif: true,
  url: 'https://kanyro.elio-pallois.fr',
};

export const SITE = {
  nom: 'Kanyro',
  baseline: 'Sites et visibilité pour les artisans du bâtiment',
  /** Adresse de production, une fois la bêta terminée. */
  urlPublique: 'https://www.kanyro.fr',
  /** Adresse réellement servie aujourd'hui — c'est elle qui fait foi partout. */
  url: BETA.actif ? BETA.url : 'https://www.kanyro.fr',
  langue: 'fr-FR',

  /*
   * ⚠ Adresse de bêta, sur le domaine personnel.
   *
   * `kanyro@elio-pallois.fr` le temps des tests. À rebasculer sur le domaine de
   * l'agence à l'ouverture commerciale — et le jour où ça arrive, penser aux
   * deux endroits que ce fichier ne pilote pas : `$destinataire`/`$expediteur`
   * en haut de `public/contact.php`, et l'adresse figurant sur les devis déjà
   * envoyés.
   *
   * `telephone` est au format international, seul format que `tel:` compose sans
   * ambiguïté depuis l'étranger ; `telephoneAffiche` est la forme lisible. Les
   * deux servent aussi le JSON-LD et les mentions légales.
   */
  contact: {
    email: 'kanyro@elio-pallois.fr',
    telephone: '+33649072478',
    telephoneAffiche: '06 49 07 24 78',
  },

  /*
   * Prise de rendez-vous — lien sortant, volontairement pas d'iframe.
   *
   * Un widget embarqué imposerait d'ouvrir la CSP à `frame-src` et `script-src`,
   * déposerait des cookies tiers — ce qui rendrait fausse l'affirmation des
   * mentions légales — et doublerait le poids de la page pour une fonction
   * secondaire. Un lien coûte zéro.
   *
   * Le bouton ne s'affiche pas tant que l'URL est vide : un bouton de
   * réservation qui ne mène nulle part est pire que pas de bouton.
   * Voir docs/prise-de-rendez-vous.md pour la configuration des créneaux.
   */
  rendezVous: {
    url: '',
    libelle: 'Réserver un créneau',
    duree: '20 minutes',
  },

  /*
   * Zone d'intervention : Arrageois, bassin minier, métropole lilloise.
   *
   * ⚠ `ville` et `codePostal` doivent porter l'ADRESSE RÉELLE de l'entreprise,
   * pas le centre géographique de la zone couverte : ils alimentent les mentions
   * légales et le JSON-LD `LocalBusiness`. Arras est un point de départ
   * cohérent — 20 min du bassin minier, 45 min de Lille — mais à remplacer par
   * l'adresse d'immatriculation avant la mise en ligne.
   *
   * Les communes réellement couvertes sont dans src/data/communes.json et
   * alimentent `areaServed`.
   */
  zone: {
    ville: 'Arras',
    departement: 'Pas-de-Calais',
    region: 'Hauts-de-France',
    codePostal: '62000',
    pays: 'FR',
  },

  reseaux: {
    linkedin: '',
    instagram: '',
    facebook: '',
  },

  /** Renseigner après immatriculation — sert aussi aux mentions légales. */
  legal: {
    siren: '',
    formeJuridique: 'Entreprise individuelle',
    directeurPublication: 'Elio Pallois',
    /* L'identification exacte de l'hébergeur est une obligation de l'article 19
       de la LCEN. À corriger si vous changez d'hébergement. */
    hebergeur: 'OVH SAS — 2 rue Kellermann, 59100 Roubaix, France — 1007',
  },
};

/**
 * Interrupteurs de périmètre.
 *
 * Le site reste volontairement court tant qu'il n'y a pas de premier client :
 * une vitrine qui porte l'offre, le prix, la preuve et l'appel à l'action, et
 * rien d'autre. Construire davantage avant d'avoir vendu, c'est repousser le
 * moment de vendre.
 *
 * Le code des pages locales et des réalisations n'est pas supprimé pour autant,
 * seulement désactivé : le jour où le premier ou le deuxième chantier est livré,
 * ces deux booléens suffisent à tout réactiver. `getStaticPaths` renvoie une
 * liste vide quand l'interrupteur est à false, donc aucune page n'est générée et
 * aucun lien n'est affiché.
 */
export const FONCTIONS = {
  /** Pages « métier × commune » — à rallumer à l'industrialisation. */
  pagesLocales: false,
  /** Galerie de réalisations — à rallumer dès qu'un chantier est livré. */
  realisations: false,
};

/**
 * Normalise un chemin en l'URL réellement servie au visiteur.
 *
 * Le site est en `build.format: 'directory'` et `trailingSlash: 'never'` : Astro
 * génère /contact/index.html, Apache le sert à /contact via DirectoryIndex, et
 * c'est /contact qui doit être annoncé partout. Selon le contexte,
 * `Astro.url.pathname` peut arriver ici en '/contact/', en '/contact/index' ou —
 * si le format repassait un jour à 'file' — en '/contact.html'. Les trois formes
 * sont ramenées à '/contact'.
 *
 * Sans ce nettoyage, le canonical et og:url annonceraient une adresse différente
 * de celle du sitemap et de celle que Google visite — de quoi diluer le
 * référencement des pages locales, qui sont justement le cœur du dispositif.
 */
export function cheminPropre(chemin = '/') {
  let p = chemin.replace(/\.html$/, '');
  if (p.endsWith('/index')) p = p.slice(0, -'/index'.length);
  if (p === '/index' || p === '') p = '/';
  // Pas de slash final, conformément à `trailingSlash: 'never'`.
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/** Construit une URL absolue — exigée par OpenGraph et les canonical. */
export function urlAbsolue(chemin = '/') {
  return new URL(cheminPropre(chemin), SITE.url).href;
}
