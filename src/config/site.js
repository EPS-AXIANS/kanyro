/**
 * Source unique de vérité pour tout ce qui identifie l'agence.
 *
 * Le nom n'est pas encore déposé à l'INPI (recherche d'antériorité classes 35/42
 * en cours). Tout est centralisé ici pour qu'un changement de nom se répercute
 * partout sans chasse au texte en dur.
 */
/**
 * Domaine de production : kanyro.tech.
 *
 * Le canonical, og:url et le sitemap doivent annoncer l'adresse RÉELLEMENT
 * servie. Annoncer une autre adresse que celle qui répond, c'est dire à Google
 * d'indexer une page qui n'existe pas au bon endroit.
 */
export const BETA = {
  actif: false,
  url: 'https://kanyro.tech',
};

export const SITE = {
  nom: 'Kanyro',
  baseline: 'Sites et visibilité pour les artisans du bâtiment',
  /** Adresse de production. */
  urlPublique: 'https://kanyro.tech',
  /** Adresse réellement servie — c'est elle qui fait foi partout. */
  url: BETA.actif ? BETA.url : 'https://kanyro.tech',
  langue: 'fr-FR',

  /*
   * Adresse de contact sur le domaine kanyro.tech.
   *
   * Les deux servent aussi le JSON-LD et les mentions légales.
   *
   * `telephone` est au format international, seul format que `tel:` compose sans
   * ambiguïté depuis l'étranger ; `telephoneAffiche` est la forme lisible.
   */
  contact: {
    email: 'contact@kanyro.tech',
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
   * C'est une ZONE, pas une adresse. Elle portait auparavant `ville: 'Arras et
   * Lille'` et `codePostal: '62000 et 59000'`, recopiés tels quels dans les
   * mentions légales et dans l'adresse du JSON-LD : deux villes et deux codes
   * postaux dans des champs qui n'en attendent qu'un, soit une adresse fictive.
   * L'adresse réelle vit désormais dans `legal.adresse`, et nulle part ailleurs.
   *
   * Les communes réellement couvertes sont dans src/data/communes.json et
   * alimentent `areaServed`.
   */
  zone: {
    libelle: 'Arrageois, bassin minier et métropole lilloise',
    region: 'Hauts-de-France',
    pays: 'FR',
  },

  /*
   * Une chaîne vide tant que le compte n'existe pas. Ni `'#'`, ni une page
   * d'accueil de réseau : c'est `reseauxActifs()` plus bas qui décide de ce
   * qui s'affiche, et il ne laisse passer qu'une vraie adresse https.
   */
  reseaux: {
    linkedin: 'https://www.linkedin.com/in/elio-pallois/',
    instagram: '',
    facebook: '',
  },

  /*
   * Mentions légales (LCEN, article 6 III) — ne renseigner QUE des données
   * réelles. Un champ vide n'est pas affiché ; un texte d'attente, lui, le
   * serait comme une information légale. C'est ce qui s'est passé : « SIREN :
   * Arrive prochainement » a été publié en production, et le garde-fou des
   * mentions légales, qui ne testait que le vide, ne s'est pas déclenché.
   * `champsLegauxManquants()` plus bas vérifie maintenant la FORME des
   * données, et le build signale ce qui manque.
   */
  legal: {
    /* Neuf chiffres, espaces permis. Vide tant que l'immatriculation n'a pas
       eu lieu. */
    siren: '',
    formeJuridique: 'Entreprise individuelle',
    directeurPublication: 'Elio Pallois',
    /* Adresse de l'établissement ou de la domiciliation, telle qu'elle figure
       à l'immatriculation. Vide tant qu'elle n'est pas fixée : ni la zone
       d'intervention, ni une ville « de départ ». */
    adresse: {
      rue: '',
      codePostal: '',
      ville: '',
    },
    /*
     * Régime de TVA, qui décide de la mention affichée à côté des prix.
     *   'franchise' : TVA non applicable, article 293 B du CGI.
     *   'assujetti' : les prix sont affichés HT.
     *   ''          : aucune mention (et le build le signale).
     *
     * 'franchise' est le régime sur lequel le modèle de devis est construit
     * (docs/devis-modele.md, « micro-entreprise en franchise de TVA »). À
     * confirmer au moment de l'immatriculation, et à changer ici s'il diffère.
     */
    tva: 'franchise',
    /* Identification de l'hébergeur — obligation de l'article 6 III de la
       LCEN, qui demande aussi son numéro de téléphone. VPS Hostinger. À
       corriger si vous changez d'hébergement.

       Le téléphone n'est pas écrit de mémoire : il vient de la fiche
       organisation de Hostinger au RIPE (ORG-ARta1-RIPE, tenue par Hostinger
       lui-même, modifiée le 15 mai 2026), lue le 11 septembre 2026 avec la
       même adresse que ci-dessous. `curl -s
       https://rest.db.ripe.net/ripe/organisation/ORG-ARta1-RIPE.json` pour
       la revérifier. */
    hebergeur: 'Hostinger International, Ltd., 61 Lordou Vyronos Street, Lumiel Commercial Centre, 4th floor, 6023 Larnaca, Chypre',
    hebergeurTelephone: '+370 645 03378',
    hebergeurSite: 'https://www.hostinger.fr',
  },
};

/** Le SIREN s'il a la forme d'un SIREN (neuf chiffres), sinon une chaîne vide. */
export function sirenValide() {
  const brut = (SITE.legal.siren ?? '').replace(/\s/g, '');
  return /^\d{9}$/.test(brut) ? brut.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '';
}

/** L'adresse légale si elle est complète, sinon `null`. */
export function adresseLegale() {
  const { rue, codePostal, ville } = SITE.legal.adresse ?? {};
  return rue && /^\d{5}$/.test(codePostal ?? '') && ville ? { rue, codePostal, ville } : null;
}

/**
 * La mention à poser à côté d'un prix, selon `legal.tva`. Une seule formulation
 * pour tout le site : l'offre, le suivi et les mentions légales la lisent ici.
 */
export function mentionTva() {
  if (SITE.legal.tva === 'franchise') return 'TVA non applicable, article 293 B du CGI';
  if (SITE.legal.tva === 'assujetti') return 'Prix hors taxes';
  return '';
}

/**
 * Ce qui manque aux mentions légales. Lu par la page des mentions légales, qui
 * l'écrit dans les journaux du build : c'est à la mise en ligne qu'il faut le
 * voir, pas au visiteur qu'il faut le montrer.
 */
export function champsLegauxManquants() {
  return [
    !sirenValide() && 'SIREN (neuf chiffres)',
    !adresseLegale() && 'adresse (rue, code postal, ville)',
    !SITE.contact.telephone && 'téléphone',
    !SITE.legal.hebergeurTelephone && "téléphone de l'hébergeur",
    !SITE.legal.tva && 'régime de TVA',
  ].filter(Boolean);
}

/**
 * Interrupteurs de périmètre.
 *
 * Le site reste volontairement court tant qu'il n'y a pas de premier client :
 * une vitrine qui porte l'offre, le prix, la preuve et l'appel à l'action, et
 * rien d'autre. Construire davantage avant d'avoir vendu, c'est repousser le
 * moment de vendre.
 *
 * Le code des pages locales et des réalisations n'est pas supprimé pour autant,
 * seulement désactivé : chaque booléen suffit à rallumer sa partie.
 * `getStaticPaths` renvoie une liste vide quand l'interrupteur est à false,
 * donc aucune page n'est générée et aucun lien n'est affiché.
 *
 * ---- Pages métier et pages par commune, séparées ----
 *
 * Elles partageaient un seul interrupteur, `pagesLocales` : impossible de
 * publier les six pages métier (déjà écrites dans metiers.json, et seules à
 * pouvoir se placer sur « site internet couvreur », « site internet
 * plombier »…) sans publier en même temps les 36 pages métier × commune.
 * Celles-ci sont le principal risque du site : des pages qui ne diffèrent que
 * par un toponyme sont ce que Google appelle des doorway pages, et la sanction
 * frappe le domaine entier (voir [commune].astro et le README).
 */
export const FONCTIONS = {
  /** Les six pages métier et leur index /metiers. */
  pagesMetiers: true,
  /** Pages « métier × commune » — à ne rallumer que commune par commune, avec
   *  un contexte local vrai et propre à chacune. */
  pagesCommunes: false,
  /** Galerie de réalisations — à rallumer dès qu'un chantier est livré. */
  realisations: true,
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

/**
 * Les réseaux réellement ouverts, dans l'ordre de `SITE.reseaux`.
 *
 * Le pied de page et le `sameAs` du JSON-LD lisaient chacun `SITE.reseaux` avec
 * leur propre filtre, `filter(Boolean)`, qui laissait passer `'#'` : deux icônes
 * mortes sur chaque page et deux URL invalides dans les données structurées.
 * Un seul filtre, une seule règle : une adresse https, ou rien.
 */
export function reseauxActifs() {
  return Object.entries(SITE.reseaux)
    .filter(([, url]) => typeof url === 'string' && /^https:\/\/[^/\s]+\.[^/\s]+/.test(url))
    .map(([nom, url]) => ({ nom, url }));
}

/** Construit une URL absolue — exigée par OpenGraph et les canonical. */
export function urlAbsolue(chemin = '/') {
  return new URL(cheminPropre(chemin), SITE.url).href;
}
