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
 * Offre mensuelle — VOLONTAIREMENT PAS ENCORE EN VITRINE.
 *
 * Vendre un abonnement suppose des livrables récurrents concrets et tenables
 * chaque mois. Tant que le rythme réel n'a pas été mesuré sur un vrai client,
 * l'annoncer serait promettre un engagement dont on ignore le coût.
 *
 * À activer après le premier ou le deuxième client, en remplaçant cette liste
 * par ce qui aura effectivement été livré tous les mois.
 */
export const offreMensuelle = {
  actif: false,
  nom: 'Suivi',
  prix: '90 – 190 €/mois',
  livrablesAValider: [
    'Hébergement, nom de domaine et certificat',
    'Sauvegardes et mises à jour de sécurité',
    'Ajout des nouveaux chantiers dans la galerie',
    'Relevé mensuel des positions sur les recherches visées',
  ],
};
