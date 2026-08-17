/**
 * Source unique de vérité pour tout ce qui identifie l'agence.
 *
 * Le nom n'est pas encore déposé à l'INPI (recherche d'antériorité classes 35/42
 * en cours). Tout est centralisé ici pour qu'un changement de nom se répercute
 * partout sans chasse au texte en dur.
 */
export const SITE = {
  nom: 'Kanyro',
  baseline: 'Sites et visibilité pour les artisans du bâtiment',
  url: 'https://www.kanyro.fr',
  langue: 'fr-FR',

  contact: {
    email: 'bonjour@kanyro.fr',
    telephone: '',
    telephoneAffiche: '',
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
 * `build.format: 'file'` fait qu'Astro.url.pathname vaut '/metiers/couvreur.html'
 * à la génération, alors que Netlify sert la page à '/metiers/couvreur'. Sans ce
 * nettoyage, le canonical et og:url annoncent une adresse différente de celle du
 * sitemap et de celle que Google visite — de quoi diluer le référencement des
 * pages locales, qui sont justement le cœur du dispositif.
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
