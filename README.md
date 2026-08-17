# Kanyro

Site de l'agence. Astro en sortie statique, Tailwind 4, hébergement Netlify.
Direction visuelle sombre et cinématographique, reprise d'un template de galerie
d'art et transposée sur le socle SEO.

```bash
npm run dev      # développement, http://localhost:4321
npm run build    # génère dist/
npm run preview  # sert dist/ — c'est ici qu'on vérifie, la CSP n'existe qu'en prod
```

> **Ne jamais ouvrir `dist/index.html` en double-cliquant.** Les chemins générés
> sont absolus (`/_astro/…`) : en `file://` le navigateur les cherche à la racine
> du disque, et la page s'affiche sans style. Un site statique se sert par HTTP.

---

## Déploiement — OVH mutualisé

Uploader **le contenu de `dist/`** (pas le dossier lui-même) dans `www/`. Le
build produit tout ce qu'il faut, y compris `.htaccess` et `contact.php`.

Vérifier après l'upload que `_astro/` et `js/` sont bien présents à côté de
`index.html` : certains clients FTP échouent silencieusement sur les
sous-dossiers.

### Ce que `.htaccess` prend en charge

Il remplace ce que `netlify.toml` fournissait : redirection HTTPS forcée,
en-têtes de sécurité, cache des assets hashés, compression, page 404.

Il gère aussi les **URL sans slash final**. Astro déclare le canonical
`/contact` ; sans la règle `DirectorySlash Off`, Apache redirigerait vers
`/contact/` et le visiteur arriverait sur une adresse différente de celle
annoncée à Google.

> **HSTS est commenté**, volontairement. À décommenter seulement une fois le
> certificat vérifié et le site accessible en HTTPS sans erreur : une fois
> l'en-tête envoyé, le navigateur refuse le HTTP pendant un an, même si vous
> faites machine arrière.

### Le formulaire

`public/contact.php`, sans dépendance ni service tiers. Netlify Forms a été
abandonné : sa détection se fait au déploiement chez Netlify, donc sur OVH le
formulaire postait dans le vide.

**Prérequis :** `mail()` n'est accepté par OVH que si l'expéditeur appartient au
domaine hébergé. Créez `bonjour@kanyro.fr` dans votre espace client **avant** de
tester, sinon les messages seront rejetés ou classés en spam. Les deux adresses
se règlent en haut de `contact.php`.

En cas d'échec d'envoi, le visiteur est renvoyé sur `/contact?erreur=1` et un
bandeau lui donne l'adresse mail directe — un échec silencieux sur l'unique
chemin de conversion serait le pire des scénarios.

### `upgrade-insecure-requests`

Cette directive est portée par l'en-tête HTTP du `.htaccess`, **jamais par la
balise `<meta>`**. Dans le HTML elle partirait partout, y compris là où HTTPS
n'est pas actif — certificat non provisionné, préproduction, test depuis une IP
du réseau local. Le navigateur irait alors chercher `https://…/_astro/style.css`
sur un serveur qui ne parle pas HTTPS, et la page s'afficherait en HTML brut.

Le piège est que tout fonctionne sur `localhost`, que la spécification exempte
des adresses de bouclage : le symptôme n'apparaît qu'une fois déployé.

---

## Périmètre actuel : vitrine courte, 5 pages

Une offre, un prix, un délai, une preuve honnête, un appel à l'action. Rien
d'autre, et c'est délibéré : construire davantage avant d'avoir vendu repousse le
moment de vendre.

| Page | Rôle |
|---|---|
| `/` | Porte tout : offre, prix, délai, questions, preuve, appel à l'action |
| `/contact` | Formulaire de demande de devis |
| `/mentions-legales` | Obligations légales |
| `/merci`, `/404` | Techniques, `noindex` |

**Ce qui est écrit mais désactivé** — les 6 pages métier, les 36 pages
« métier × commune » et la galerie de réalisations. Le code est intact ; seuls
deux booléens de `FONCTIONS` dans `src/config/site.js` les éteignent, et
`getStaticPaths` renvoie une liste vide. Les rallumer après le premier ou le
deuxième vrai client est une ligne à changer, pas un chantier à refaire.

**L'offre mensuelle est volontairement absente de la vitrine.** Vendre un
abonnement suppose des livrables récurrents concrets et tenables chaque mois.
Tant que ce rythme n'a pas été mesuré sur un vrai client, l'annoncer serait
promettre un engagement dont on ignore le coût. Le squelette attend dans
`src/data/offres.js`, avec `actif: false`.

## Documents de travail

Dans `docs/`, hors du site :

| Fichier | Usage |
|---|---|
| `prise-de-rendez-vous.md` | Configuration Cal.com adaptée au rythme d'alternance |
| `questionnaire-client.md` | À remplir en rendez-vous, pas à envoyer par mail |
| `devis-modele.md` | Modèle avec les mentions légales obligatoires |
| `processus-livraison.md` | Les six étapes et le cahier de recette |

## Prise de rendez-vous

Lien sortant vers Cal.com, pas d'iframe : un widget embarqué imposerait d'ouvrir
la CSP à `frame-src`, déposerait des cookies tiers — rendant fausse
l'affirmation des mentions légales — et doublerait le poids de la page pour une
fonction secondaire.

Le bouton n'apparaît que si `rendezVous.url` est renseigné dans
`src/config/site.js`. Tant que le compte n'existe pas, la page contact bascule
d'elle-même sur le champ « quand vous joindre » du formulaire.

---

## ⚠ À REMPLACER AVANT TOUTE MISE EN LIGNE

Ces éléments viennent du template de référence. Ils permettent de juger le rendu
tout de suite, mais **aucun ne doit rester en production.**

### 1. La fonte Arsenica Trial

Chargée depuis `db.onlinewebfonts.com` dans `src/layouts/Base.astro`.

« Trial » désigne une version d'essai : **elle n'est pas licenciée pour un usage
commercial**, et le site qui la sert la redistribue sans en détenir les droits.
Sur la vitrine d'une entreprise qui facture, c'est une exposition réelle.

Options : acheter Arsenica chez son fondeur, ou basculer sur une serif display
libre au caractère proche — Fraunces, Instrument Serif, Bodoni Moda. Dans les
deux cas, auto-héberger le fichier dans `public/fonts/` et remplacer le `@font-face`.

### 2. Les médias

Tous centralisés dans `src/config/medias.js` — vidéo d'accueil, nuages, colombe,
fonds de section. Ils pointent vers le CloudFront et l'export Figma d'un tiers.

Deux risques : ces URL peuvent disparaître sans préavis, et rien n'établit le
droit de les diffuser. À remplacer par vos propres visuels — idéalement des
photos de chantiers réels, qui serviront de toute façon mieux le propos.

### 3. Resserrer la CSP après remplacement

Une fois fontes et médias rapatriés dans `public/` :

1. vider les tableaux de `HOTES_MEDIAS` dans `src/config/medias.js` ;
2. retirer les mêmes hôtes de l'en-tête `Content-Security-Policy` de `netlify.toml`.

La politique se resserre alors d'elle-même. Les deux fichiers doivent rester le
miroir l'un de l'autre.

### 4. Le reste

- [ ] SIREN et téléphone dans `src/config/site.js` — sans SIREN, les mentions
      légales sont en infraction (article 19 de la LCEN). La page affiche un
      encart d'avertissement tant que le champ est vide.
- [ ] Image de partage (`og:image`), à passer via la prop `image` du layout.
      Aucune balise n'est émise tant qu'elle n'existe pas, ce qui vaut mieux
      qu'une balise pointant vers un fichier absent.
- [ ] Favicon définitive une fois le logo dessiné.
- [ ] Redirection `kaniro.fr` à décommenter dans `netlify.toml` si le domaine
      défensif est réservé.
- [ ] **Tester le formulaire de bout en bout après déploiement.** Netlify Forms
      ne se câble qu'en ligne, la détection se fait au déploiement. Invérifiable
      en local.
- [ ] Livrer un chantier de référence avant de pousser le site.

---

## Décisions structurantes

**Sortie statique, un seul script de 2,8 Ko.** Le site vend du référencement
local : il ne peut pas dépendre du client pour afficher son contenu. Le seul
JavaScript gère les révélations au scroll et la parallaxe — purement décoratif.

**Le contenu ne dépend jamais du script.** `.reveal { opacity: 0 }` n'est appliqué
que sous `@media (scripting: enabled)`. Sans JavaScript, sans
`IntersectionObserver`, ou si le script échoue, tout reste lisible. C'est la
condition pour avoir ces effets sans risquer une page vide pour un robot.

**Zéro style inline.** Les délais d'animation passent par des classes Tailwind
littérales, les fonds par des `<img>` positionnées. Ça permet de garder
`style-src` sans `'unsafe-inline'` malgré la richesse visuelle.

**Le script d'effets est servi depuis `public/`, pas bundlé.** Astro inline les
petits scripts, et un script inline est bloqué par `script-src 'self'` : en
production le script ne s'exécutait pas et les pages s'affichaient vides. Le
développement ne le montrait pas, puisque la CSP n'y est pas émise. Le coût est
l'absence de minification sur 2,8 Ko.

**Palette nommée par rôle** (`fond`, `surface`, `texte`) et non par teinte. Le
thème est passé du clair au sombre en cours de route ; des noms comme « craie »
ou « encre » gardaient un sens inversé, et un `bg-encre text-craie` sur page noire
donne un bouton invisible. Le rôle survit au changement de thème.

---

## Où toucher quoi

| Besoin | Fichier |
|---|---|
| Nom, coordonnées, SIREN, réseaux | `src/config/site.js` |
| **Rallumer pages locales / réalisations** | `FONCTIONS` dans `src/config/site.js` |
| **Médias provisoires + hôtes CSP** | `src/config/medias.js` |
| Palette, typo, boutons, animations | `src/styles/global.css` |
| L'offre, le prix, le tarif de lancement | `src/data/offres.js` |
| Métiers couverts | `src/data/metiers.json` |
| Communes couvertes | `src/data/communes.json` |
| JSON-LD | `src/config/schema.js` |
| Sections de l'accueil | `src/components/sections/` |
| En-têtes HTTP, redirections | `netlify.toml` |

---

## Les pages « métier × ville »

`src/pages/metiers/[metier]/[commune].astro` génère le produit cartésien des deux
fichiers de données. C'est le principal levier de référencement local, et **c'est
aussi la partie la plus risquée du site.**

Générer N × M pages qui ne diffèrent que par un toponyme substitué correspond à la
définition Google de la *doorway page*. La sanction frappe le domaine entier.

Ce qui protège aujourd'hui : chaque commune porte un `contexte` écrit à la main
(nature du bâti, contraintes locales réelles) et chaque métier le sien. Le
générateur saute toute commune dépourvue de `contexte`.

> **Règle à tenir :** ne jamais ajouter une commune sans lui écrire un contexte
> propre et véridique. Six bonnes pages valent mieux que soixante vides.

---

## Réalisations

`src/content/realisations/*.md`, avec `brouillon: true` par défaut pour qu'un
exemple ne parte jamais en production. `_gabarit.md` montre la structure.

Aucune fiche réelle pour l'instant : la page affiche un état vide assumé plutôt
que de fausses références. Dans un tissu artisanal local, les artisans se
connaissent — une référence inventée se découvre et coûte plus cher qu'elle ne
rapporte.

---

## Vérifications passées

Sur le build de production, CSP active :

- 5 pages, une seule balise `h1` par page, aucun script ni style inline
- Le script d'effets se charge et déclenche les 30 révélations de l'accueil
- Aucun lien mort, toutes les ancres de la navbar résolvent
- Prix, tarif de lancement et délai présents dans le HTML statique ; offre
  mensuelle absente
- Contenu intégralement lisible sans exécuter de JavaScript
- `canonical` et `og:url` sur l'URL propre, alignés sur le sitemap
- Sitemap réduit à `/` et `/contact` ; pages `noindex` exclues
- Aucun débordement horizontal
- Vidéo, fontes et images externes chargées sans violation de CSP
