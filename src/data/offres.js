/**
 * UNE offre. Pas trois.
 *
 * Un catalogue oblige le prospect à choisir, et un artisan qui hésite entre
 * trois formules ne choisit pas : il repousse. Une offre unique déplace la
 * question de « laquelle ? » à « oui ou non ? », qui est la seule qui compte
 * tant qu'il n'y a pas de premier client.
 *
 * Le prix est affiché : ça élimine les rendez-vous non qualifiés, ce qui est
 * vital quand on ne dispose que de ses soirées.
 */
export const offre = {
  nom: 'Site orienté devis',
  /*
   * « Pensé pour », et pas « vous trouverez » : la page refuse plus bas de
   * garantir une position sur Google, la promesse du premier écran ne peut pas
   * la garantir à sa place. C'est une intention de conception, pas un résultat.
   */
  promesse:
    'Un site pensé pour qu’un client qui cherche votre métier dans sa commune vous trouve, voie vos chantiers et vous demande un devis.',
  /* L'intro de la section Offre. Elle répétait mot pour mot la promesse du
     hero, deux écrans plus bas ; elle dit maintenant ce qu'on achète. */
  introduction:
    'Cinq pages écrites avec vous, vos chantiers en photo, votre fiche Google créée ou reprise. Vous n’avez rien de technique à gérer.',
  prix: '1 900 à 3 900 €',
  /* Le bas de la fourchette, pour les endroits où la fourchette entière ne
     tient pas (le premier écran). Le même nombre que `prix`, jamais un autre. */
  prixDepart: '1 900 €',
  mention: 'une seule fois, tout compris la première année',
  delai: '1 à 2 semaines',

  pour: [
    'Vous n’avez pas de site, ou un site que vous n’osez pas montrer',
    'Vos clients viennent presque tous du bouche-à-oreille',
    'Vous voulez des demandes de devis, pas une carte de visite en ligne',
  ],

  contenu: [
    {
      titre: 'Un site construit autour du devis',
      detail:
        'Cinq pages, écrites avec vous. Le bouton « demander un devis » est visible partout, le formulaire arrive directement dans votre boîte mail, et votre numéro est cliquable sur téléphone.',
    },
    {
      titre: 'Vos chantiers en photo',
      detail:
        'Vous m’envoyez celles de vos chantiers finis, je fais le tri. Pas de photos ? Je me déplace pour en faire, en supplément. Dans le bâtiment, c’est la photo qui signe le devis, pas le texte.',
    },
    {
      titre: 'Visibilité locale',
      detail:
        'Fiche Google Business créée ou reprise et optimisée, et des pages pensées pour les recherches réelles de vos clients, votre métier associé à vos communes.',
    },
    {
      titre: 'Vous êtes propriétaire',
      detail:
        'Nom de domaine et contenu à votre nom dès le premier jour. Hébergement, certificat et nom de domaine inclus la première année.',
    },
  ],

  /* Dit tôt et par écrit : un prospect qui découvre ça après signature devient
     un litige, et un litige dans un tissu local coûte plus qu'un client. */
  horsPerimetre: [
    'Je ne gère pas vos réseaux sociaux au quotidien',
    'Je ne fais pas de boutique en ligne à gros catalogue',
    'Je ne garantis pas une position sur Google, personne ne le peut sérieusement',
  ],
};

/**
 * Tarif de lancement pour les tout premiers chantiers.
 *
 * Ce n'est pas une remise commerciale, c'est le prix du risque : le client
 * accepte de travailler avec quelqu'un qui n'a pas encore de références. Il est
 * normal que ça se paie dans le prix, et le dire ainsi vaut mieux que de brader
 * sans l'expliquer.
 *
 * ⚠ `quota` et `prixBarre` ne sont pas décoratifs.
 *
 * Deux prix affichés sur la même page sans règle qui les relie, et le prospect
 * n'en retient qu'une chose : le prix se négocie. La discussion commerciale
 * devient un marchandage avant même le premier rendez-vous.
 *
 * Le quota répond à « pourquoi lui et pas moi ? » — parce qu'il était dans les
 * trois premiers — et il crée la seule urgence honnête dont on dispose quand on
 * n'a rien à montrer. `prixBarre` reprend le bas de la fourchette normale, pas
 * un prix gonflé pour l'occasion : afficher 3 900 € barré serait un faux rabais.
 *
 * `restants` se décrémente à la main après chaque signature. À zéro, l'offre
 * disparaît d'elle-même — c'est ce qui la rend crédible. La laisser tourner
 * après le troisième client transforme la rareté annoncée en mensonge, et un
 * artisan qui repasse sur le site six mois plus tard le verra.
 */
export const tarifReference = {
  actif: true,
  prix: '1 200 €',
  prixBarre: '1 900 €',
  quota: 3,
  restants: 3,
  contrepartie:
    'En échange, j’utilise votre chantier comme référence : photos, chiffres et votre nom sur le site, avec votre accord écrit.',
};

/**
 * Suivi — hébergement et entretien du site, après la première année. Deux
 * formules : Kanyro Maintenance et Kanyro Accompagnement.
 *
 * ⚠ OUVERT AVANT LA MESURE PRÉVUE. Décidé le 30 août 2026 sur la branche
 * feat/forfait-suivi-mensuel, jamais fusionnée ; repris ici et mis en vitrine
 * le 11 septembre, à la demande du propriétaire. Scindé en deux formules le
 * même jour, toujours à sa demande : l'unique forfait Suivi à 25 €/mois est
 * devenu Maintenance à 29 € et Accompagnement à 59 €.
 *
 * Ce bloc portait auparavant `actif: false` et une consigne : ne pas vendre
 * d'abonnement tant que le rythme réel n'a pas été mesuré sur un vrai client.
 * La décision de l'ouvrir quand même a été prise sciemment. Ce qui limite le
 * risque, ce n'est donc pas la mesure — elle reste à faire — c'est la façon
 * dont `comparatif` est dimensionné : voir le calcul de marge plus bas.
 *
 * ── Deux formules, alors que l'offre de tête dit « une, pas trois » ─────
 *
 * Le bloc `offre` en haut de ce fichier refuse le catalogue parce qu'un
 * artisan qui hésite ne signe pas. Ici, le choix ne pèse pas sur la signature :
 * il ne se pose qu'au onzième mois, sur un site qui tourne déjà. D'ici là, la
 * seule question reste « oui ou non » pour le site.
 *
 * ── Pourquoi ces prix ──────────────────────────────────────────────────
 *
 * Le coût d'infrastructure réel est d'environ 2 à 3 € par mois et par site :
 * une part du VPS Hostinger déjà en service, le renouvellement du nom de
 * domaine, et le certificat qui ne coûte rien (Let's Encrypt).
 *
 * Le prix ne paie donc pas l'infrastructure, il paie le fait que personne
 * n'ait à y penser — d'où l'obligation d'écrire `engagement` : sans délai
 * annoncé, 290 € par an face aux ~30 € que coûte un hébergement repris en
 * main ne se défend pas en rendez-vous. C'est ce qui sépare un forfait d'une
 * revente d'hébergement avec marge, et un artisan fait très bien la
 * différence.
 *
 * Point de comparaison interne, à ne pas citer tel quel à un client : la
 * formule Pro de Cloudflare est à 20 $/mois et par domaine, et ne couvre
 * qu'une couche technique — pas un site entretenu, et personne au bout du
 * fil. L'argument est bon en interne pour situer le prix ; en rendez-vous il
 * s'attaque trop facilement, puisque l'hébergement statique nu, lui, est
 * gratuit chez le même fournisseur.
 *
 * ── Le calcul qui contraint `comparatif` ──────────────────────────────
 *
 * Compté sur le prix annuel, le plus bas des deux, et moins ~36 €
 * d'infrastructure, au même taux horaire visé qu'avant :
 *
 *   Maintenance     290 € → 254 €, soit à peine quatre heures par an.
 *                   Les deux modifications par mois, si elles sont toutes
 *                   prises, les consomment à elles seules (24 × ~10 min).
 *                   C'est pourquoi le relevé mensuel n'y est plus.
 *
 *   Accompagnement  590 € → 554 €, soit un peu plus de huit heures par an.
 *                   Le relevé mensuel en prend trois (12 × ~15 min). Il en
 *                   reste cinq pour des modifications « illimitées », les
 *                   petites évolutions et la visibilité locale.
 *
 * ⚠ C'EST LA LIGNE « ILLIMITÉES » QUI PORTE LE RISQUE, pas le prix. Sa seule
 * borne est `note` : une demande à la fois, sur les pages existantes. Si cette
 * phrase disparaît du site, ou du devis, la formule se vend à perte dès le
 * premier client bavard, sans que rien ne le signale avant la fin de l'année.
 *
 * Toute ligne ajoutée au comparatif doit être retranchée de ces heures.
 *
 * ── À vérifier après le premier client ────────────────────────────────
 *
 * Noter le temps réellement passé chaque mois (cf. docs/processus-livraison.md).
 * Si le relevé mensuel dépasse 20 minutes, c'est lui qu'il faut automatiser ou
 * passer au trimestre — pas le prix qu'il faut monter.
 */
export const offreMensuelle = {
  actif: true,
  /* Le mot « abonnement » et les deux services qu'il paie sont écrits en toutes
     lettres, dès la première phrase : un nom de forfait seul ne dit pas ce
     qu'on achète, et c'est ce qu'on doit comprendre sans rien lire d'autre. */
  promesse:
    'Un abonnement pour l’hébergement et la maintenance de votre site, une fois créé, en deux formules. Il reste en ligne, à jour et surveillé, sans que vous ayez à y penser.',

  /* La première formule est aussi le prix d'appel : Offre.astro et la Q&R
     l'annoncent en « à partir de ». Garder la moins chère en tête. */
  formules: [
    { nom: 'Maintenance', prix: '29 €/mois', prixAnnuel: '290 €/an' },
    { nom: 'Accompagnement', prix: '59 €/mois', prixAnnuel: '590 €/an' },
  ],
  mentionAnnuel: 'deux mois offerts',

  /* Le forfait ne démarre qu'à la fin de la première année, déjà comprise dans
     le prix du site. Le dire ici évite qu'il soit présenté comme un supplément
     immédiat, ce qui ferait monter le prix d'entrée dans l'esprit du prospect. */
  demarrage: 'à la fin de la première année, qui est comprise dans le prix du site',

  /*
   * Une ligne par prestation, une valeur par formule, dans l'ordre de
   * `formules` : `true` coché, `false` absent, une chaîne s'affiche telle
   * quelle. La forme `{ texte, note: true }` accroche en plus l'astérisque qui
   * renvoie à `note`.
   *
   * `detail` est facultatif, et il ne s'invente pas : chaque phrase reprend un
   * engagement déjà écrit ailleurs. Une ligne qu'on ne sait pas encore décrire
   * — « petites évolutions » — reste nue plutôt que de promettre au hasard.
   */
  comparatif: [
    {
      titre: 'Hébergement',
      detail: 'Sur un serveur tenu à jour, à ma charge.',
      valeurs: [true, true],
    },
    {
      titre: 'Nom de domaine',
      detail: 'Renouvelé à échéance, toujours à votre nom.',
      valeurs: [true, true],
    },
    {
      titre: 'Certificat SSL',
      detail: 'Le cadenas dans la barre d’adresse.',
      valeurs: [true, true],
    },
    {
      titre: 'Sauvegardes',
      detail: 'Chaque nuit, trente jours d’historique.',
      valeurs: [true, true],
    },
    {
      titre: 'Surveillance',
      detail: 'Si le site tombe, je suis prévenu avant vous.',
      valeurs: [true, true],
    },
    { titre: 'Corrections techniques', valeurs: [true, true] },
    {
      titre: 'Modifications de textes et de photos',
      detail: 'Vous m’envoyez le texte ou les photos, je m’occupe du reste.',
      valeurs: ['2 par mois', { texte: 'Illimitées', note: true }],
    },
    { titre: 'Petites évolutions', valeurs: [false, true] },
    {
      titre: 'Suivi des performances',
      detail: 'Un relevé chaque mois : où vous sortez, combien vous ont écrit.',
      valeurs: [false, true],
    },
    { titre: 'Visibilité locale et référencement', valeurs: [false, true] },
    {
      titre: 'Support prioritaire',
      detail: 'Vos demandes passent avant les autres.',
      valeurs: [false, true],
    },
  ],

  /* La borne de « Illimitées » — voir le calcul de marge plus haut. */
  note: 'Sur les pages existantes, une demande à la fois : la suivante part dès que la précédente est en ligne. Les nouvelles pages et les refontes restent sur devis.',

  /* Le palier tarifaire retenu n'est défendable qu'écrit. Un délai annoncé
     qu'on ne tient pas vaut moins que pas de délai du tout : ces deux chiffres
     doivent rester tenables un soir de semaine, en alternance. Ils valent pour
     les deux formules — la priorité d'Accompagnement passe devant, elle ne
     rallonge pas le délai de l'autre. */
  engagement: [
    'Je réponds à vos demandes sous 24 heures ouvrées',
    'Site inaccessible : remise en ligne sous 24 heures ouvrées, depuis la sauvegarde de la veille',
  ],

  horsPerimetre: [
    'Les nouvelles pages et les refontes font l’objet d’un devis à part',
    'Je ne gère pas vos réseaux sociaux au quotidien',
    'Je ne réécris pas vos textes, mais les corrections courtes sont comprises',
  ],

  /* Sans porte de sortie explicite, un forfait se lit comme un piège, et c'est
     précisément la crainte que la promesse « le site vous appartient » cherche
     à lever ailleurs sur le site. La contredire ici annulerait les deux. */
  sortie:
    'Sans engagement de durée, résiliable à tout moment avec un mois de préavis. Le site et le nom de domaine sont à vous : je transfère l’hébergement et les fichiers à qui vous voulez, sans frais de sortie.',

  /* Repris tel quel dans la Q&R et dans le devis : c'est le chiffre auquel le
     forfait se compare, et le taire donnerait l'impression de le cacher. */
  alternative:
    'une trentaine d’euros par an si vous reprenez l’hébergement à votre nom',
};
