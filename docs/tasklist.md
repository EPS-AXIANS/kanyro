# Tasklist — audit externe + vérification dans le code

> Établie le 18/08/2026 à partir d'un audit réalisé par une IA externe **qui n'a
> lu que le HTML public du site**, puis recoupée point par point avec le code.
>
> **Avancement au 23/08/2026 : 27 points sur 37.** Médias rapatriés et CSP
> refermée, formulaire testé de bout en bout, dette technique nettoyée (code
> mort, favicon), 4 objections ajoutées à la Q&R, zone d'intervention
> clarifiée. Reste bloqué sur une donnée manquante : 0.1 (SIREN). Le reste des
> points ouverts attend soit un premier client (3.1, 3.2, 4.1), soit une mise en
> ligne publique (4.6), soit une décision ou un
> chantier pas encore lancés (1.2, 4.2, 5.2, 5.4, 7.1).
>
> *(Le total annoncé était « 42 » jusqu'au 19/08 : en énumérant les points
> numérotés, de 0.1 à 7.6, il y en a 37.)*
>
> Chaque point porte un verdict :
>
> - ✅ **Confirmé** — le problème existe bien dans le code.
> - ⚠️ **À nuancer** — l'observation est juste, la conclusion l'est moins.
> - ❌ **Faux** — l'audit s'est trompé, rien à corriger (ou l'inverse de ce qu'il croit).
> - 🔍 **Trouvé en plus** — problème réel que l'audit ne pouvait pas voir.

---

## 0. Bloquants avant toute mise en ligne

- [ ] **0.1 — SIREN et téléphone** ✅ *Confirmé.* `SITE.legal.siren` et

  `SITE.contact.telephone` sont vides dans `src/config/site.js:23,66`. La page
  mentions légales affiche donc son encart « À compléter avant la mise en
  ligne », et le JSON-LD `ProfessionalService` sort sans `telephone`.
  Sans SIREN : infraction à l'article 19 de la LCEN.
  → **Téléphone fait le 18/08/2026** (`06 49 07 24 78`, stocké en
  `+33649072478` pour que `tel:` compose sans ambiguïté). Il apparaît
  désormais dans le JSON-LD, le pied de page, la page contact et les mentions
  légales. L'adresse de contact est passée à `kanyro@elio-pallois.fr` le temps
  de la bêta.
  → **Reste le SIREN**, seul champ encore vide : l'encart d'avertissement des
  mentions légales s'est réduit à lui. Une ligne dans `src/config/site.js` le
  fera disparaître.

- [x] **0.2 — Fonte « Arsenica Trial » non licenciée** 🔍 *Trouvé en plus.*

  `src/layouts/Base.astro:97` charge une version d'**essai** depuis
  `db.onlinewebfonts.com`, un redistributeur tiers. Interdite en usage
  commercial, et c'est toute l'identité visuelle du site qui repose dessus.
  → **Constaté au rendu le 19/08/2026 : les chiffres de la fonte sont
  neutralisés.** Les dix chiffres sortent tous comme un même symbole — mesuré
  en comparant la signature de pixels de chacun, identique de `0` à `9`, alors
  que les lettres diffèrent. C'est le bridage habituel d'une version d'essai.
  La numérotation de `sections/Processus.astro` est passée en Inter, seule
  rustine possible ; aucun autre chiffre du site n'était en Arsenica, les prix
  étaient déjà en Inter. Autrement dit, la fonte n'est pas seulement interdite
  en production, elle est **incomplète**.
  → **Fait le 19/08/2026.** Cormorant (titres) et Archivo (texte), toutes deux
  en SIL OFL, installées par `@fontsource-variable` et importées dans
  `Base.astro` : les .woff2 sont émis dans le bundle et servis depuis le
  domaine. Les cinq `<link>` vers `fonts.googleapis.com`, `fonts.gstatic.com`
  et `db.onlinewebfonts.com` ont disparu du `<head>`.
  → **Inter est parti aussi, pour une autre raison.** Rien d'illicite, mais
  c'est la fonte par défaut d'une grande partie du web récent : elle donnait
  au site l'air d'être sorti d'un gabarit. Archivo tient les grandes capitales
  du Showcase sans ce défaut.
  → Les classes ont été renommées `font-titre` / `font-texte` dans les 19
  fichiers qui les utilisaient — `font-inter` pointant sur autre chose
  qu'Inter était un piège à six mois. Chiffres revérifiés au rendu après
  bascule : les six testés sont bien distincts.

- [x] **0.3 — Tous les médias appartiennent à quelqu'un d'autre** 🔍 *Trouvé en plus.*

  `src/config/medias.js` : vidéo d'accueil, nuages, colombe, fonds de section
  pointent vers le CloudFront et l'export Figma d'un tiers. Elles peuvent
  disparaître du jour au lendemain, et rien n'établit le droit de les diffuser
  sur un site commercial.
  → Remplacer par des visuels à vous. Idéalement : photos de chantiers réels.
  → **Fait le 23/08/2026.** Les deux problèmes étaient distincts et se sont
  réglés séparément : le droit d'usage existait déjà (licence commerciale
  complète achetée sur le template), et les 6 fichiers ont été rapatriés dans
  `public/medias/` — le site ne dépend plus du CDN du vendeur, qui pouvait
  disparaître sans préavis. Remplacer par de vraies photos de chantiers reste
  une amélioration future, plus une urgence.

- [x] **0.4 — Resserrer la CSP après 0.2 et 0.3** 🔍

  Une fois fontes et médias rapatriés : vider `HOTES_MEDIAS`
  (`src/config/medias.js`) **et** retirer les mêmes hôtes de `public/.htaccess`.
  Les deux doivent rester le miroir l'un de l'autre.
  → **Moitié faite le 19/08/2026, avec 0.2.** `fontes` et `styles` sont vides,
  `style-src` et `font-src` sont revenus à `'self'` des deux côtés. Restent
  `img-src` et `media-src`, qui tomberont avec 0.3.
  → Au passage, les directives sont assemblées par une petite fonction plutôt
  que par interpolation : une liste vide produisait `font-src 'self'`  avec un
  espace en trop, ce qui rendait la comparaison à l'œil avec `.htaccess`
  pénible.
  → **Deuxième moitié faite le 23/08/2026, avec 0.3.** `images` et `video` sont
  vides à leur tour, `img-src` et `media-src` sont revenus à `'self'` (plus
  `data:` pour les images). `HOTES_MEDIAS` est intégralement vide, et
  `public/.htaccess` en reste le miroir exact.

- [x] **0.5 — Trancher l'hébergement : OVH ou Netlify** 🔍 *Trouvé en plus, sérieux.*

  Le repo contient les deux configurations. `netlify.toml` est resté, et le
  README annonce « hébergement Netlify » en ligne 3 avant de décrire un
  déploiement OVH en section 2. Or `public/contact.php` **ne s'exécute pas sur
  Netlify** (pas de PHP) : un déploiement Netlify par erreur ⇒ `/contact.php`
  renvoie 404 ⇒ zéro demande de devis, sans message d'erreur.
  → Si OVH : supprimer `netlify.toml` et corriger la ligne 3 du README.
  → Si Netlify : supprimer `contact.php` + `.htaccess` et recâbler le
    formulaire (fonction serverless ou service tiers).
  → **Fait le 18/08/2026 — OVH retenu.** `netlify.toml` supprimé (son contenu
  était déjà dupliqué dans `.htaccess`), README corrigé, et une section
  « Si vous migrez un jour chez Cloudflare » ajoutée : elle liste les trois
  choses qui tombent ce jour-là (`.htaccess` ignoré, `contact.php` non
  exécuté, hébergeur à changer dans les mentions légales).

- [x] **0.6 — Empêcher l'indexation de la bêta** 🔍 *Trouvé en plus, urgent.*

  Le site tourne sur `elio-pallois.fr` pendant les essais. Si Google indexe
  cette adresse, c'est elle qui sort dans les résultats — et le jour de
  l'ouverture, `kanyro.fr` publie un contenu déjà connu ailleurs : au mieux la
  notoriété reste sur le mauvais domaine, au pire les deux se concurrencent.
  → **Fait le 18/08/2026.** Un objet `BETA` dans `src/config/site.js` pilote
  tout d'un bloc : `SITE.url` (donc canonical, `og:url` et sitemap annoncent
  l'adresse réellement servie), `noindex` forcé sur **toutes** les pages, et
  `robots.txt` en `Disallow: /`. Bascule testée dans les deux sens.
  → ⚠ **Reste à faire par vous :** `robots.txt` est une demande, pas une
  serrure — un lien partagé suffit à faire entrer l'URL dans l'index. Le bloc
  d'authentification HTTP est prêt et commenté en haut de `public/.htaccess`,
  il ne manque que le `.htpasswd` à créer chez OVH.
  → ⚠ Servir la bêta depuis un **sous-dossier** ne marchera pas (chemins
  absolus + `.htaccess` à la racine). Il faut un sous-domaine —
  `https://kanyro.elio-pallois.fr`, confirmé le 18/08/2026.

---

## 1. Tunnel de conversion

### 1.1 — « Le formulaire est en panne » ❌ **Faux**

L'audit a lu, dans le HTML de `/contact`, le texte :

> « Votre message n'est pas parti — le problème vient de mon côté, pas du vôtre. »

C'est un bandeau `**hidden**` (`src/pages/contact.astro:55`), dévoilé uniquement
par `public/js/effets.js:31` quand l'URL porte `?erreur=1`. Un crawler qui lit le
HTML brut le voit ; un visiteur, non. Le parcours normal est
`POST /contact.php` → `/merci`, et `/merci` affiche déjà exactement ce que
l'audit recommande d'ajouter : « Merci, j'ai bien reçu votre demande. Je vous
réponds sous 48 heures. »

**Rien à corriger sur ce point.** Mais il a fait remonter trois vrais problèmes :

- [x] **1.1a — `/merci` promet un email qui n'est jamais envoyé** 🔍 *Bug réel.*

  `src/pages/merci.astro:19` dit « répondez directement à l'email que vous
  allez recevoir ». Or `public/contact.php` n'envoie qu'**un seul** mail, au
  gérant. Le visiteur n'en reçoit aucun.
  → Soit ajouter un accusé de réception au visiteur dans `contact.php`, soit
    retirer la promesse de `merci.astro`. (Recommandation : l'accusé de
    réception — il rassure et il ouvre le fil de discussion.)
  → **Fait.** `contact.php` envoie désormais un accusé de réception au visiteur,
  avec le rappel de son message et `Auto-Submitted: auto-replied` pour ne pas
  déclencher le répondeur automatique d'en face. Envoi au mieux : son échec
  ne fait pas croire au visiteur que sa demande n'est pas partie.

- [x] **1.1b — Une erreur de saisie est présentée comme une panne serveur** 🔍

  `contact.php:88` renvoie vers `?erreur=1` aussi bien quand `mail()` échoue
  que quand l'email saisi est invalide. Dans le second cas, le visiteur lit
  « le problème vient de mon côté » alors qu'il a juste fait une faute de
  frappe — et **tout ce qu'il avait tapé est perdu**.
  → Distinguer les deux cas (`?erreur=saisie` / `?erreur=envoi`) et repasser
    les champs saisis dans la redirection.
  → **Fait.** Trois motifs distincts (`saisie`, `limite`, `envoi`), un bandeau
  par motif dans `contact.astro`, et la saisie restaurée depuis sessionStorage
  — pas depuis l'URL, qui aurait fait fuiter email et message dans les
  journaux serveur, l'historique et l'en-tête `Referer`.

- [x] **1.1c — Le formulaire n'a jamais été testé de bout en bout** ✅

  `mail()` chez OVH exige que `$expediteur` soit une adresse réellement créée
  sur le domaine. Sans SPF/DKIM corrects, les demandes partent en spam.
  → Créer `kanyro@elio-pallois.fr` chez OVH (l'expéditeur doit appartenir au
    domaine **hébergé**, donc au domaine perso pendant la bêta), vérifier
    SPF + DKIM, puis envoyer un vrai test depuis le site en ligne : réception,
    accusé de réception côté visiteur, `Reply-To`, accents UTF-8.
  → **Fait — confirmé par le propriétaire le 23/08/2026.**

- [x] **1.1d — Aucune limite d'envoi sur `contact.php`** 🔍

  Le pot de miel arrête les robots basiques, rien n'arrête un envoi répété.
  → Ajouter une limite simple par IP (fichier ou session) avant la mise en
    ligne, sinon la boîte peut être noyée.
  → **Fait, et devenu obligatoire.** Un accusé de réception sans limite d'envoi
  transforme le formulaire en outil de mail-bombing : on soumet l'adresse d'un
  tiers en boucle, il reçoit le flot, et c'est kanyro.fr qui est signalé comme
  spammeur. 5 envois/heure/IP, IP hachée, verrou `flock`, et laisse passer si
  le disque est en lecture seule.

### 1.2 — Mesure des conversions ✅ *Confirmé*

- [ ] **1.2 — Aucun suivi n'est en place.** Les mentions légales affirment (à

  juste titre aujourd'hui) « aucun cookie, aucun outil de mesure ». Impossible
  donc de savoir combien de visiteurs cliquent « Demander un devis ».
  → Installer une mesure **sans cookie** (Plausible, ou Matomo auto-hébergé en
    mode cookieless) pour garder la promesse RGPD. Impose de : ajouter l'hôte
    dans `HOTES_MEDIAS`/`.htaccess` (`script-src`, `connect-src`) **et**
    mettre à jour la section Cookies des mentions légales.

---

## 2. Message et offre

- [x] **2.1 — Le `h1` de l'accueil ne dit ni le métier, ni la cible, ni le lieu** ✅

  *Confirmé, et plus grave que ce que dit l'audit.*
  `src/components/sections/Hero.astro:44` : le `h1` est littéralement
  « TROIS / CHANTIERS ». Ce n'est pas seulement un problème de compréhension
  en 5 secondes — c'est **le seul `h1` du site, et il ne contient aucun mot-clé**.
  Pour un site qui vend du référencement local, c'est une contradiction visible.
  → Garder l'accroche économique, mais faire porter au `h1` la promesse :
    « Votre site doit vous apporter des demandes de devis », avec un
    sous-titre qui pose *artisans du bâtiment* + *Hauts-de-France*.
    « TROIS CHANTIERS » descend en accroche secondaire — la section
    `Showcase` (« Le calcul est court ») est déjà exactement à sa place pour ça.
  → **Fait le 18/08/2026.** Le `h1` devient « Sites internet pour artisans du
  bâtiment », dans le même duo serif/sans qu'avant — la signature
  typographique est conservée, seuls les mots changent. La promesse sous le
  titre vient de `offre.promesse`, donc elle ne peut plus diverger de la
  section Offre. « TROIS CHANTIERS » n'est pas perdu : il descend d'un écran
  et devient le `h2` du Showcase, qui s'appelait déjà « Le calcul est court »
  et existait pour porter cet argument.

- [x] **2.2 — 1 200 € et 1 900–2 900 € cohabitent sans règle** ✅ *Confirmé.*

  `src/data/offres.js:29` affiche `1 900 – 2 900 €`, et `tarifReference:69`
  affiche `1 200 €` deux sections plus bas. Aucun quota, aucune échéance,
  aucun « au lieu de ». Un prospect en déduit que le prix se négocie.
  → Ajouter `quota` et `echeance` à `tarifReference`, afficher
    « 1 200 € au lieu de 1 900 € — 3 premières entreprises », et retirer
    l'offre (`actif: false`) une fois les trois signées.
  → **Fait.** `tarifReference` porte maintenant `quota: 3`, `restants: 3` et
  `prixBarre: '1 900 €'` — le bas de la fourchette normale, pas un prix gonflé
  pour l'occasion : un faux rabais se voit. Le bloc preuve affiche le prix
  barré, « 3 premières entreprises » et le nombre de places restantes ; le
  prix principal y renvoie par un lien, parce que c'est en lisant
  1 900–2 900 € qu'on se demande pourquoi l'autre existe. À `restants: 0`,
  la section disparaît d'elle-même.

- [x] **2.3 — La FAQ parle d'un abonnement qui n'existe nulle part** ⚠️ *À nuancer.*

  L'audit demande d'afficher un prix mensuel. Or `offreMensuelle.actif = false`
  est une décision documentée et défendable : on ne vend pas un engagement
  récurrent dont on n'a jamais mesuré le coût réel.
  **Mais** `QandA.astro:33` répond à « L'abonnement mensuel est obligatoire ? »
  — donc la page mentionne un produit dont elle ne donne ni le prix ni le
  contenu. C'est ça, l'incohérence à corriger, pas l'absence de prix.
  → Court terme : reformuler la réponse pour qu'elle décrive l'après-livraison
    sans nommer un produit fantôme.
  → Après le 1er client : activer `offreMensuelle` avec les livrables
    réellement tenus, et là seulement afficher un prix.
  → **Fait le 23/08.** La question devient « Et après la mise en ligne, il se
  passe quoi ? » et décrit le réel : première année comprise, puis reprise en
  main ou accompagnement, sans nommer de produit fantôme.
  → **Volet abonnement clos le 30/08, sans attendre le premier client.**
  `offreMensuelle` est actif : 25 €/mois ou 250 €/an, démarrage à la fin de la
  première année. La condition posée ici — « activer avec les livrables
  réellement tenus » — n'est donc **pas** remplie : les livrables sont
  dimensionnés par un calcul de marge, pas par une mesure. C'est un pari
  assumé, à vérifier sur le premier chantier ; le premier signal à surveiller
  est le temps réel du relevé mensuel, budgété à 15 minutes.
  Le forfait a d'abord été tenu hors de la vitrine, pour la raison même de 2.2,
  puis mis en section pleine le 31/08 sur demande — « que le prix et toutes les
  informations soient plus explicites et visibles ». Le risque de 2.2 est donc
  réel et traité autrement : la règle qui relie les deux tarifs est écrite sous
  le prix du site (`Offre.astro`) et rappelée dans la section (`Suivi.astro`),
  parce que la première année est comprise et que les deux montants ne portent
  pas sur la même période. **Si l'une des deux mentions saute, 2.2 se rouvre.**

- [x] **2.4 — Aucune section « Comment ça se passe ? »** ✅ *Confirmé, et facile.*

  L'accueil enchaîne Hero → Showcase → Offre → Q&amp;R → Citation. Rien n'explique
  ce qui se passe après le « oui ».
  → **Le contenu existe déjà** : `docs/processus-livraison.md` décrit les six
    étapes. Il suffit d'en faire un composant `sections/Processus.astro` et de
    l'insérer entre `Offre` et `QandA`.
  → **Fait.** `sections/Processus.astro`, six étapes, inséré entre Offre et
  Q&amp;R — on ne se demande « comment ça se passe » qu'une fois qu'on sait ce
  qu'on achète et combien. Contenu tiré de `processus-livraison.md` mais
  **réécrit** : ce document est une checklist interne (acompte de 30 %,
  modifications facturées, relances). Ce qui appartient au devis n'a rien à
  faire sur une page de vente.

- [x] **2.5 — Vocabulaire trop « agence » par endroits** ✅ *Confirmé, mineur.*

  `QandA.astro:29` : « un site techniquement propre », « un suivi chiffré de
  vos positions mois par mois ».
  → Remplacer par le résultat : « chaque mois, je vous montre ce qui change :
    votre visibilité sur Google, les visites, et les demandes reçues. »
  → **Fait.** « un site techniquement propre » et « un suivi chiffré de vos
  positions mois par mois » deviennent « un site rapide qui s'affiche
  correctement sur un téléphone » et « chaque mois un point sur ce qui
  change — où vous sortez sur Google, combien de personnes sont venues,
  combien vous ont écrit ».

- [x] **2.6 — Ajouter 4–5 objections concrètes à la Q&amp;R** ✅ *Confirmé.*

  Manquent : « je n'ai pas de belles photos », « j'ai déjà une fiche Google »,
  « je travaille au bouche-à-oreille », « je n'ai pas le temps de m'en
  occuper », « vous pouvez reprendre mon ancien site ? ».
  → ⚠️ Détail technique : `QandA.astro` est câblé en 3 + 3 avec un tableau
    `delais` de 6 littéraux Tailwind. Ajouter des questions impose d'étendre
    ce tableau — une classe assemblée à l'exécution ne serait jamais générée
    par Tailwind.
  → **Fait le 23/08/2026.** 4 des 5 objections ajoutées, colonnes passées à
  5 + 5, `delais` étendu à 10 entrées littérales, décalage de la colonne droite
  recalculé (`i + 5`). « J'ai déjà une fiche Google » a été laissée de côté
  pour garder les deux colonnes symétriques — elle reste disponible si une
  sixième entrée s'ajoute un jour.

- [x] **2.7 — Un seul libellé d'appel à l'action** ✅ *Confirmé, mineur.*

  Quatre libellés différents aujourd'hui : « Demander un devis » (Hero, Offre),
  « Voir l'offre » (Showcase), « En parler » (bloc preuve), « Envoyer ma
  demande » (formulaire).
  → Garder « Demander un devis » partout où l'action est la même. « En parler »
    (`Offre.astro:171`) devient « Demander un devis ».
  → **Fait.** « En parler » devient « Demander un devis », et le bouton passe en
  primaire — c'était le seul appel à l'action secondaire sur le chemin de
  conversion. L'accueil affiche désormais quatre fois le même libellé.
  « Voir l'offre » reste dans le Showcase : c'est de la navigation interne
  vers `#offre`, pas un appel à l'action concurrent.

---

## 3. Preuve

- [ ] **3.1 — Il n'y a aucune preuve externe** ✅ *Confirmé.* Le bloc « Je démarre,

  et ça se voit » est honnête et bien joué, mais il ne répond pas à
  « pourquoi vous confier 2 000 € ? ».
  → Construire **une** démonstration complète et étiquetée comme telle
    (« Exemple de démonstration — pas un client Kanyro ») : accueil, page
    métier, page métier × commune, formulaire. Le socle technique existe
    déjà, voir 4.1.
  → ⚠️ Ne jamais présenter une maquette comme un client. La section actuelle
    tire toute sa force de ça.

- [ ] **3.2 — Faire des 3 premiers clients un actif marketing** ✅ *Décision commerciale.*

  Prévoir dès le devis l'autorisation écrite d'exploiter : photos avant/après,
  nom, métier, commune, et les chiffres à 3 mois (visites, demandes reçues).
  `docs/devis-modele.md` est l'endroit où l'ajouter.

---

## 4. SEO local

- [ ] **4.1 — « Je ne vois pas de pages métier/ville »** ⚠️ *À moitié faux.*

  L'audit a raison sur le site public, tort sur le code : les 6 pages métier et
  les 36 pages « métier × commune » **sont écrites** — `src/pages/metiers/` —
  avec pour chaque commune un contexte local réel (bâti, contraintes ABF,
  cités minières…), un JSON-LD `Service`, et un garde-fou explicite contre les
  *doorway pages*. Elles sont éteintes par `FONCTIONS.pagesLocales = false`.
  Sa mise en garde contre les pages clonées est donc déjà traitée.
  **Le vrai problème est ailleurs** : `Offre.astro` promet au client « des pages
  pensées pour les recherches réelles de vos clients », et le site de Kanyro
  n'en a aucune. On vend ce qu'on ne montre pas.
  → **Décision à prendre :** basculer `pagesLocales` à `true` (le contenu est
    réellement différencié, il tient la route), ou assumer et adoucir la
    promesse jusqu'au premier client.

- [ ] **4.2 — Aucune image de partage (`og:image`)** ✅ *Confirmé.*

  Aucune page ne passe la prop `image` au layout (`grep image= src/pages/` →
  vide), donc aucune balise `og:image` n'est émise. Un lien Kanyro partagé sur
  WhatsApp ou Facebook — le canal principal chez les artisans — s'affiche en
  rectangle gris.
  → Créer une image 1200×630 dans `public/`, la passer via `image` sur
    l'accueil et le contact.

- [x] **4.3 — Le reste de la checklist SEO : déjà en place** ❌ *Rien à faire.*

  Vérifié dans `src/layouts/Base.astro` : `<title>` unique par page, meta
  description, `h1` unique, canonical propre (`cheminPropre`), Open Graph,
  Twitter Card, JSON-LD `ProfessionalService` + `BreadcrumbList`,
  `sitemap-index.xml` généré et filtré des pages `noindex`, `robots.txt`,
  URL sans slash final, `alt=""` + `aria-hidden` corrects sur les images
  décoratives. Ce point de l'audit est couvert.

- [x] **4.4 — Poids et vitesse : le vrai angle mort** 🔍 *Trouvé en plus.*

  L'audit dit « à vérifier ». Vérifié : c'est mauvais.
  `Hero.astro:8` charge une **vidéo plein écran en autoplay**, sans `poster`,
  sans `preload`, depuis un CloudFront tiers — c'est le LCP de la page
  d'accueil. S'y ajoutent 2 feuilles de style externes bloquantes (Google
  Fonts + onlinewebfonts) et 4 images distantes sans `width`/`height` (donc
  décalages de mise en page).
  → Après 0.2/0.3 : auto-héberger, ajouter un `poster`, passer les images par
    `<Image />` d'Astro avec dimensions, et mesurer au PageSpeed.
  → **Volet fontes fait le 19/08/2026.** Les deux feuilles de style externes
  bloquantes ont disparu : plus aucune connexion à un tiers n'est ouverte
  avant le premier rendu. Le navigateur télécharge ~102 ko de woff2 latin
  (Cormorant romain 35 + italique 38 + Archivo 35), servis depuis le domaine
  et en `font-display: swap`. Restent la vidéo plein écran et les images sans dimensions, qui
  pèsent bien plus lourd.

- [x] **4.5 — `robots.txt` contredit le `noindex` de `/merci`** 🔍 *Mineur.*

  `public/robots.txt:5` interdit l'exploration de `/merci`, ce qui empêche
  Google d'y **lire** le `noindex` de la page. Les deux signaux s'annulent.
  → **Fait.** `public/robots.txt` est supprimé au profit de
    `src/pages/robots.txt.js`, généré : le `Disallow: /merci` a disparu, le
    `noindex` seul fait foi. Le fichier suit maintenant la bascule `BETA`, ce
    qu'un fichier statique n'aurait pas pu faire.

- [ ] **4.6 — Search Console** ✅ Non configurée. À faire à la mise en ligne :

  propriété vérifiée + sitemap soumis.

---

## 5. Accessibilité et mobile

- [x] **5.1 — Cibles tactiles sous la taille minimale** ✅ *Confirmé, l'audit vise juste.*

  - `Header.astro` : liens de nav à **9 px** avec `py-2.5` ⇒ ~34 px de haut,
    et 4 libellés + logo serrés dans une pastille sur mobile.
  - `Footer.astro` : icônes réseaux/mail à `h-3.5 w-3.5` ⇒ **14 px**.
  - `.bouton-primaire` : ~42 px de haut sur mobile, tout juste sous la barre.
  → Viser 44 px de hauteur tactile partout (le padding suffit, la taille du
    texte peut rester).

- [ ] **5.2 — La vidéo d'accueil ignore `prefers-reduced-motion`** 🔍

  `effets.js` respecte scrupuleusement la préférence pour les révélations et
  la parallaxe, mais la vidéo `autoplay loop` du Hero, elle, tourne quoi qu'il
  arrive. C'est le plus gros mouvement de la page.
  → Ne lancer la lecture que si `matchMedia('(prefers-reduced-motion)')` est
    à `no-preference`, sinon afficher le `poster`.
  → **Décision du propriétaire, 23/08/2026 : pas fait, volontairement.** La
  vidéo doit jouer dans tous les cas ; la recommandation de l'audit est
  écartée en connaissance de cause, pas oubliée.
  → 🔍 **Un vrai bug a été trouvé et corrigé à côté.** Sur mobile, l'économie
  d'énergie ou de données bloque l'autoplay et le navigateur affiche son
  propre bouton de lecture — centré, donc sous le bloc de texte du hero, donc
  injoignable : la vidéo restait figée. `effets.js` relance `play()` au
  premier geste de l'utilisateur n'importe où sur la page. Le test sur un
  vrai téléphone reste à faire (voir 5.4).

- [x] **5.3 — Longueur du formulaire** ⚠️ *À nuancer.*

  L'audit conseille de raccourcir. Sur 7 champs, **3 seulement sont
  obligatoires** (nom, email, message) — c'est déjà court. Le vrai frein n'est
  pas le nombre de champs mais la perte de saisie en cas d'erreur (voir 1.1b).
  → Traiter 1.1b d'abord, et ne raccourcir qu'ensuite si la mesure (1.2) montre
    des abandons.
  → **Confirmé par le propriétaire, 23/08/2026 : on garde tel quel.** Cohérent
  avec la logique du point lui-même — 1.1b est traité, et rien ne justifie de
  raccourcir tant que 1.2 n'a pas mesuré d'abandon.

- [ ] **5.4 — Parcours mobile complet non testé** ✅

  → Sur un vrai téléphone : accueil → offre → contact → envoi → `/merci`,
    avec la vidéo en 4G et pas en Wi-Fi.
  → Le figement de la vidéo signalé par le propriétaire (voir 5.2) est corrigé.
  Le test complet sur un vrai appareil reste à faire.

---

## 6. Zone d'intervention

- [x] **6.1 — Périmètre annoncé plus large que la capacité réelle** ⚠️ *Avis, pas défaut.*

  `communes.json` couvre Arrageois + bassin minier + métropole lilloise, et
  l'offre promet un déplacement photo d'une demi-journée par client. Lille est
  à 45 min d'Arras : c'est tenable à 3 clients, plus à 12.
  → Sans rien retirer : afficher une hiérarchie. `Offre.astro` groupe déjà par
    secteur dans l'ordre du fichier — il suffit d'étiqueter
    « Zone prioritaire » / « Sur demande ».
  → **Résolu par clarification, 23/08/2026, sans changement de code.** Le
  propriétaire vit à Lille et travaille depuis Arras : les 3 secteurs sont
  déjà parcourus au quotidien, la réserve ne s'applique plus. La liste plate
  actuelle, sans hiérarchie, est donc déjà la bonne présentation.

---

## 7. Dette technique repérée au passage 🔍

- [ ] **7.1 — La CSP est écrite en triple** — `Base.astro:41`, `netlify.toml:19`,

  `public/.htaccess:38`. Trois copies à maintenir à la main, avec des
  commentaires qui se rappellent mutuellement de rester synchronisées : ça
  finira par diverger.
  → La générer depuis `medias.js` (au moins pour `.htaccess`, via un script de
    build), ou supprimer la copie devenue inutile après 0.5.
  → **Réduit de trois copies à deux avec 0.5** : `netlify.toml` a disparu du
  dépôt. Restent `Base.astro` et `public/.htaccess`, toujours à synchroniser à
  la main — la génération automatique proposée n'est pas faite.

- [x] **7.2 — Code mort** — `src/components/Tarif.astro` n'est importé nulle part

  et attend des propriétés (`resume`, `inclus`, `misEnAvant`) qui n'existent
  dans aucun objet de `offres.js`. `src/components/sections/Metiers.astro`
  n'est jamais importé non plus.
  → Supprimer `Tarif.astro`. Garder `Metiers.astro` **si** 4.1 est activé
    (c'est lui qui porte le maillage interne vers les pages métier), le
    supprimer sinon.
  → **Fait le 23/08/2026.** `Tarif.astro` supprimé, confirmé sans référence
  nulle part dans le dépôt ni dans le build. `Metiers.astro` conservé en
  l'état, dans l'attente de la décision du point 4.1.

- [x] **7.3 — Commentaires périmés** — `site.js:105` explique le comportement de

  `cheminPropre` par `build.format: 'file'` et cite Netlify, alors que
  `astro.config.mjs` est en `'directory'` et que le déploiement vise OVH. Le
  code est bon, l'explication ne l'est plus — c'est le genre de commentaire qui
  induit en erreur dans six mois.
  → **Fait.** Le commentaire de `cheminPropre` décrit maintenant le vrai réglage
  (`directory` + `trailingSlash: 'never'` sur Apache).

- [x] **7.4 — README contradictoire** — ligne 3 : « hébergement Netlify ».

  Section 2 : « Déploiement — OVH mutualisé ». À trancher avec 0.5.
  → **Fait.** Ligne 3 corrigée, plus la mention périmée de Netlify Forms dans la
  checklist et le renvoi à `netlify.toml` pour la redirection `kaniro.fr`.

- [x] **7.5 — Favicon provisoire**, pas d'`apple-touch-icon`. Un artisan qui ajoute

  le site à son écran d'accueil verra une icône générique.
  → **Fait le 23/08/2026.** `favicon.svg` redessiné à partir du vrai tracé du
  logo du header (il reprenait auparavant un « K » générique hérité du
  template, différent de celui affiché dans la navigation). `apple-touch-icon.png`
  (180×180) ajouté et lié dans `Base.astro`.

- [x] **7.6 — Node local trop ancien** — Astro 7 exige Node &gt;= 22.12, la version

  par défaut de la machine est la 18.19. `netlify.toml` déclare bien
  `NODE_VERSION = "24"`, mais rien ne le signale en local : `npm install` sous
  Node 18 installe le mauvais binaire `rolldown` et le build casse avec une
  erreur illisible (`Cannot find module '@rolldown/binding-wasm32-wasi'`).
  → Ajouter un `.nvmrc` (`24`) et un champ `engines` dans `package.json`.
  → **Fait.** `.nvmrc` (`24`) et `"engines": { "node": ">=22.12.0" }`.

---

## Ordre suggéré

**Cette semaine** — 0.1, ~~1.1a, 1.1b, 1.1c, 0.5~~
*Le tunnel doit être irréprochable avant d'envoyer un seul prospect dessus. Ne reste que 0.1 (SIREN).*

**Ensuite** — ~~2.1, 2.2, 2.3, 2.4~~
*Le premier écran et la lisibilité du prix : le plus gros gain pour le moins d'effort. Entièrement fait.*

**Avant la mise en ligne publique** — ~~0.2, 0.3, 0.4~~, 4.2, ~~4.4, 5.1~~
*Les blocages juridiques et le poids de la page. Ne reste que 4.2 (og:image).*

**Après le premier client** — 3.1, 3.2, 4.1
*Tout ce qui a besoin d'un vrai chantier livré pour exister.*
Le volet abonnement de 2.3 en est sorti le 30/08 : il a été tranché sans la
mesure prévue. Ce qui reste à faire sur ce point n'est plus de l'activer mais de
le vérifier — relever le temps réellement passé chaque mois sur le premier
client, et corriger le contenu du forfait si le budget de quatre heures par an
est dépassé.