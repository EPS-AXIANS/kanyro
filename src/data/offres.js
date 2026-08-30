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
  promesse: 'Être trouvé sur votre métier et votre commune, et recevoir des demandes de devis.',
  prix: '1 900 – 2 900 €',
  mention: 'une seule fois, tout compris la première année',
  delai: '4 à 6 semaines',

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
        'Je me déplace une demi-journée pour photographier deux ou trois chantiers finis. Dans le bâtiment, c’est la photo qui signe le devis, pas le texte.',
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
 * un prix gonflé pour l'occasion : afficher 2 900 € barré serait un faux rabais.
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
 * Forfait Suivi — hébergement et entretien du site, après la première année.
 *
 * ⚠ ACTIVÉ LE 30 AOÛT 2026, AVANT LA MESURE PRÉVUE.
 *
 * Ce bloc portait auparavant `actif: false` et une consigne : ne pas vendre
 * d'abonnement tant que le rythme réel n'a pas été mesuré sur un vrai client.
 * La décision de l'ouvrir quand même a été prise sciemment. Ce qui limite le
 * risque, ce n'est donc pas la mesure — elle reste à faire — c'est la façon
 * dont `inclus` est dimensionné : voir le calcul de marge plus bas.
 *
 * ── Pourquoi 25 €/mois ────────────────────────────────────────────────
 *
 * Le coût d'infrastructure réel est d'environ 2 à 3 € par mois et par site :
 * une part du VPS Hostinger déjà en service, le renouvellement du nom de
 * domaine, et le certificat qui ne coûte rien (Let's Encrypt).
 *
 * Le prix ne paie donc pas l'infrastructure, il paie le fait que personne
 * n'ait à y penser — d'où l'obligation d'écrire `engagement` : sans délai
 * annoncé, 300 € par an face aux ~30 € que coûte un hébergement repris en
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
 * ── Le calcul qui contraint `inclus` ──────────────────────────────────
 *
 * 300 € par an, moins ~36 € d'infrastructure, laissent 264 € — soit environ
 * quatre heures de travail par an au taux visé, pas davantage. Le relevé
 * mensuel en consomme déjà la moitié à lui seul (12 × ~15 min).
 *
 * C'est la raison pour laquelle les ajouts de chantiers sont plafonnés au
 * trimestre et non « à la demande ». Toute ligne ajoutée ici doit être
 * retranchée de ces quatre heures, sinon le forfait se vend à perte sans que
 * rien ne le signale avant la fin de l'année.
 *
 * ── À vérifier après le premier client ────────────────────────────────
 *
 * Noter le temps réellement passé chaque mois (cf. docs/processus-livraison.md).
 * Si le relevé mensuel dépasse 20 minutes, c'est lui qu'il faut automatiser ou
 * passer au trimestre — pas le prix qu'il faut monter.
 */
export const offreMensuelle = {
  actif: true,
  nom: 'Suivi',
  promesse:
    'Votre site reste en ligne, à jour et surveillé, sans que vous ayez à y penser.',

  prix: '25 €/mois',
  prixAnnuel: '250 €/an',
  mentionAnnuel: 'deux mois offerts',

  /* Le forfait ne démarre qu'à la fin de la première année, déjà comprise dans
     le prix du site. Le dire ici évite qu'il soit présenté comme un supplément
     immédiat, ce qui ferait monter le prix d'entrée dans l'esprit du prospect. */
  demarrage: 'à la fin de la première année, qui est comprise dans le prix du site',

  inclus: [
    {
      titre: 'L’hébergement, le domaine et le certificat',
      detail:
        'Renouvelés à échéance, à ma charge. Aucune facture à suivre chez un hébergeur, aucun nom de domaine qui expire parce que le rappel est parti sur une ancienne adresse mail — c’est la panne la plus fréquente, et la plus bête.',
    },
    {
      titre: 'Sauvegarde quotidienne, conservée un mois',
      detail:
        'Le site est sauvegardé chaque nuit et la restauration est à ma charge. Trente jours d’historique : de quoi revenir en arrière même si le problème n’a été remarqué qu’au bout de deux semaines.',
    },
    {
      titre: 'Mises à jour de sécurité et surveillance',
      detail:
        'Le serveur est tenu à jour et sa disponibilité est vérifiée automatiquement. Si le site tombe, je suis prévenu avant vous.',
    },
    {
      titre: 'Un relevé chaque mois',
      detail:
        'Où vous sortez sur les recherches visées, combien de personnes sont venues, combien vous ont écrit. Envoyé même quand les chiffres sont mauvais : c’est le mois où ils baissent qu’il faut le savoir.',
    },
    {
      titre: 'Vos nouveaux chantiers ajoutés',
      detail:
        'Vous m’envoyez les photos, je m’occupe du reste — cadrage, poids des images, mise en page. Deux chantiers par trimestre.',
    },
  ],

  /* Le palier tarifaire retenu n'est défendable qu'écrit. Un délai annoncé
     qu'on ne tient pas vaut moins que pas de délai du tout : ces deux chiffres
     doivent rester tenables un soir de semaine, en alternance. */
  engagement: [
    'Je réponds à vos demandes sous 24 heures ouvrées',
    'Site inaccessible : remise en ligne sous 24 heures ouvrées, depuis la sauvegarde de la veille',
  ],

  horsPerimetre: [
    'Les nouvelles pages et les refontes font l’objet d’un devis à part',
    'Je ne gère pas vos réseaux sociaux au quotidien',
    'Je ne réécris pas vos textes dans le forfait — les corrections courtes, oui',
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
