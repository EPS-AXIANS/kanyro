# Kanyro

Site de l'agence. Astro en sortie statique, Tailwind 4, hébergement mutualisé
OVH. Direction visuelle sombre et cinématographique, reprise d'un template de
galerie d'art et transposée sur le socle SEO.

```bash
npm run verifier # contrôle que le poste a tout ce qu'il faut
npm run dev      # développement, http://localhost:4321
npm run build    # génère dist/
npm run preview  # sert dist/ — c'est ici qu'on vérifie, la CSP n'existe qu'en prod
```

**Sur un poste neuf :** `nvm install && nvm use && npm ci && npm run verifier`.
Le détail de ce qu'il faut installer — et de ce qu'il ne faut pas chercher —
est dans [`docs/environnement.md`](docs/environnement.md).

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
domaine hébergé. Pendant la bêta, c'est `elio-pallois.fr` : créez
`kanyro@elio-pallois.fr` dans votre espace client **avant** de tester, sinon les
messages seront rejetés ou classés en spam. Les adresses se règlent en haut de
`contact.php`, et doivent rester cohérentes avec `SITE.contact.email` dans
`src/config/site.js`.

En cas d'échec, le visiteur est renvoyé sur `/contact?erreur=<motif>` — `saisie`,
`limite` ou `envoi` — et `effets.js` dévoile le bandeau correspondant en
restaurant ce qu'il avait tapé. Un échec silencieux sur l'unique chemin de
conversion serait le pire des scénarios ; un message qui accuse le serveur alors
que l'adresse était mal tapée n'est guère mieux.

Le formulaire renvoie aussi un **accusé de réception** au visiteur, ce qui impose
une **limite de 5 envois par heure et par IP** : sans elle, on soumet l'adresse
d'un tiers en boucle et c'est le domaine expéditeur qui finit sur les listes
noires.

### Le serveur mail

Depuis le 26 août 2026, `contact@kanyro.tech` existe vraiment : Postfix,
Dovecot et OpenDKIM tournent sur le VPS Hostinger, à côté du site. Les demandes
de devis arrivent dans une boîte que l'on relève avec n'importe quel client mail,
et les messages sortent signés DKIM depuis notre propre domaine plutôt qu'expédiés
par les serveurs d'un tiers.

L'architecture, les correctifs posés et les enregistrements DNS encore à ajouter
chez Hostinger sont détaillés dans [`docs/serveur-mail.md`](docs/serveur-mail.md).
Sans ces enregistrements (`mail`, SPF, DKIM, DMARC, PTR), les messages partent
en spam : la boîte est fonctionnelle mais pas encore crédible aux yeux de Gmail.

### Bêta sur elio-pallois.fr

Le site tourne actuellement sur le domaine personnel. Tout est piloté par un seul
objet, `BETA` dans `src/config/site.js` :

```js
export const BETA = {
  actif: true,
  url: 'https://kanyro.elio-pallois.fr',
};
```

Tant que `actif` vaut `true` :

- `SITE.url` prend l'adresse de bêta — canonical, `og:url` et sitemap annoncent
  donc l'adresse réellement servie, et non un domaine qui ne répond pas encore ;
- **toutes** les pages sortent en `noindex`, y compris l'accueil ;
- `robots.txt` (désormais généré par `src/pages/robots.txt.js`, plus posé en dur
  dans `public/`) passe en `Disallow: /` et n'annonce plus le sitemap.

L'enjeu n'est pas cosmétique : si Google indexe la bêta, c'est elle qui sort dans
les résultats, et le jour de l'ouverture `kanyro.fr` publie un contenu déjà connu
ailleurs. Au mieux la notoriété acquise reste sur le mauvais domaine, au pire les
deux se font concurrence.

> **`robots.txt` ne ferme rien.** C'est une demande, que les robots sont libres
> d'ignorer, et un simple lien partagé suffit à faire entrer l'URL dans l'index.
> La vraie serrure est le mot de passe HTTP : le bloc est prêt et commenté en
> haut de `public/.htaccess`, il ne manque que le `.htpasswd`.

**⚠ Servir la bêta depuis un sous-dossier ne marchera pas.** Le site génère des
chemins absolus (`/_astro/…`, `/contact.php`, `/merci`) et le `.htaccess` se pose
à la racine du domaine. Il faut un sous-domaine.

**Le jour de l'ouverture :** passer `actif` à `false`. L'URL, les canonical, le
sitemap, les `noindex` et le `robots.txt` rebasculent ensemble. Restent trois
choses que ce fichier ne pilote pas — les adresses en haut de `contact.php`,
`SITE.contact.email`, et le mot de passe du `.htaccess` à retirer.

---

### Si vous migrez un jour chez Cloudflare

Cloudflare Pages est une piste envisagée pour plus tard. Trois choses tombent
le jour où vous basculez, et il vaut mieux le savoir avant :

1. **`.htaccess` est ignoré.** Apache n'y tourne pas. Les en-têtes de sécurité,
   le cache et la règle d'URL sans slash final se réécrivent dans un fichier
   `public/_headers` (même syntaxe chez Netlify, si la question se reposait).
2. **`contact.php` ne s'exécute pas.** Cloudflare Pages ne sert pas de PHP. Le
   formulaire doit être recâblé sur une Pages Function, et l'envoi de mail passe
   par un service tiers (Resend, MailChannels) puisqu'il n'y a pas de `mail()`.
   Prévoir aussi `form-action` et `connect-src` dans la CSP en conséquence.
3. **Les mentions légales changent.** `SITE.legal.hebergeur` identifie
   nommément OVH ; l'article 19 de la LCEN impose que ce soit l'hébergeur réel.

Tant que ce n'est pas fait, **ne déployez pas ce dépôt ailleurs que sur OVH** :
le formulaire tomberait en 404 sans aucun message d'erreur, et l'unique chemin
de conversion du site serait mort sans que rien ne le signale.

---

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
| `environnement.md` | Ce qu'il faut installer sur un poste neuf |
| `tasklist.md` | Corrections issues de l'audit externe, avec leur verdict |
| `prospects_artisans_arras.md` | Liste de prospection commerciale, artisans du bâtiment à Arras |
| `serveur-mail.md` | Architecture du serveur mail kanyro.tech, DNS à ajouter, accès à la boîte |

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

### 1. Les médias

Vidéo d'accueil, nuages, colombe, fonds de section : rapatriés du template de
référence dans `public/medias/`, sous licence commerciale acquise — le site ne
dépend plus du CDN du vendeur, qui pouvait disparaître sans préavis. Restent
des visuels de template, pas une urgence légale ou technique. À remplacer par
vos propres visuels quand l'occasion se présente — idéalement des photos de
chantiers réels, qui serviront de toute façon mieux le propos. Tout est
centralisé dans `src/config/medias.js`, pour qu'un remplacement soit un seul
fichier à éditer.

### 2. Le reste

- [ ] SIREN dans `src/config/site.js` (`SITE.legal.siren`) — sans lui, les
      mentions légales sont en infraction (article 19 de la LCEN). La page
      affiche un encart d'avertissement tant que le champ est vide.
- [ ] Image de partage (`og:image`), à passer via la prop `image` du layout.
      Aucune balise n'est émise tant qu'elle n'existe pas, ce qui vaut mieux
      qu'une balise pointant vers un fichier absent.
- [ ] Redirection `kaniro.fr` à ajouter dans `public/.htaccess` si le domaine
      défensif est réservé — le nom sera mal orthographié à l'oral (« Kaniro »).
      Mieux vaut une redirection 301 qu'un second site à maintenir.
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

**Typographie libre et auto-hébergée.** Cormorant pour les titres, Archivo pour
le texte, toutes deux en SIL OFL, installées par `@fontsource-variable` et
importées dans `src/layouts/Base.astro`. Elles sont donc servies depuis le
domaine : aucune requête vers un tiers avant le premier rendu, et `font-src` /
`style-src` restent à `'self'`.

Cormorant est un Garamond de display : contraste marqué, graisses fines,
italique calligraphique. Il a d'abord servi pour la seule ligne du hero, puis a
pris tous les titres — Fraunces, qui tenait ce rôle, paraissait molle à côté.
Archivo garde le texte courant et les petites capitales d'étiquette, où les
déliés de Cormorant disparaîtraient.

Le choix s'est fait contre deux écueils. La fonte d'origine, « Arsenica Trial »,
était une version d'essai non licenciée — et ses dix chiffres étaient rendus par
un seul et même symbole, ce qui ne s'est vu qu'en affichant une liste numérotée.
**Vérifiez les chiffres de toute fonte que vous adopteriez.** Inter, elle, ne
posait aucun problème juridique, mais c'est la fonte par défaut d'une grande
partie du web récent : elle donnait au site l'air d'être sorti d'un gabarit.

Les classes s'appellent `font-titre` et `font-texte`, pas `font-cormorant` : le
rôle survit au changement de fonte, comme pour la palette. Ce site en a déjà
changé deux fois sans toucher à un seul composant.

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
| En-têtes HTTP, redirections | `public/.htaccess` |

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
