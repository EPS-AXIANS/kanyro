# Kanyro

Site de l'agence. Astro en sortie statique, Tailwind 4, servi par Caddy sur un
VPS Hostinger. Direction visuelle sombre et cinématographique, reprise d'un
template de galerie d'art et transposée sur le socle SEO.

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

## Déploiement — VPS Hostinger, Caddy

Le site tourne sur le VPS `srv1917309.hstgr.cloud` (Hostinger), servi par le
**Caddy du système** depuis `/var/www/kanyro`. La configuration est dans
`/etc/caddy/Caddyfile`, **hors du dépôt**, et `contact.php` est exécuté par
PHP-FPM 8.3 via `unix/run/php/php-fpm.sock`.

Publier, c'est donc synchroniser le contenu de `dist/` vers `/var/www/kanyro/`.
Le répertoire est accessible en écriture sans `sudo`.

```bash
npm run build

# Sauvegarder d'abord : la synchronisation supprime ce qui n'est plus produit.
tar -czf ~/kanyro-sauvegarde-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/www kanyro

rsync -rlt --delete --no-perms --no-owner --no-group \
      --exclude '.htaccess' --exclude 'demo/' dist/ /var/www/kanyro/
```

⚠ **`--exclude 'demo/'` n'est pas facultatif.** `/var/www/kanyro/demo/` contient
la démonstration du chantier de reliure, qui n'est PAS produite par ce build :
elle vient d'un autre dépôt. Sans l'exclusion, `--delete` l'efface à chaque mise
en ligne, et le lien « voir la maquette » de la fiche de réalisation tombe.

Ajouter `--dry-run --itemize-changes` pour voir ce qui bougerait avant de le
faire. Les trois `--no-*` laissent au répertoire ses permissions et son
propriétaire (`caddy:caddy`, avec le bit setgid) : sans eux, rsync lui
appliquerait ceux de `dist/` et un déploiement suivant, fait par un autre
utilisateur, pourrait ne plus passer.

**`--exclude '.htaccess'` n'est pas un détail.** Caddy ne le lit pas, mais il le
SERVIRAIT comme un fichier ordinaire : `https://kanyro.tech/.htaccess`
publierait la politique de sécurité du site.

### La démonstration du chantier de reliure

`/demo/reliure-deranty/` sert le site de l'atelier de reliure, construit depuis
son propre dépôt avec `base: '/demo/reliure-deranty'` et déposé à la main. C'est
ce que vise le lien « voir la maquette » de la fiche de réalisation.

Trois choses à savoir avant d'y toucher :

- **Seules les pages publiques y sont.** Le formulaire de rendez-vous et
  l'espace atelier de ce site-là tournent sur un Worker Cloudflare, absent ici :
  envoyer le formulaire de la démo tombe en 404.
- **Les douze pages portent `noindex, nofollow`**, posé sur la sortie construite.
  Sans ça, Google indexerait le futur site de l'atelier sous le domaine de
  l'agence et les deux se feraient concurrence le jour de la vraie mise en ligne.
  Et surtout **pas** de `Disallow` dans `robots.txt` : il empêcherait le robot de
  lire le `noindex`.
- **Astro ne préfixe que ce qu'il génère.** Les `href` écrits à la main dans le
  balisage gardent leur `/` de tête et s'échappent du sous-chemin : ils sont
  réécrits après le build, dans le balisage comme dans les chaînes compilées
  dans les scripts.

Ces trois passes sont dans `scripts/deployer-demo-reliure.mjs`. Mettre la démo à
jour tient donc en une commande, après avoir tiré la nouvelle version du projet
de reliure :

```bash
git -C ~/orca/workspaces/reliure-fderanty pull
node scripts/deployer-demo-reliure.mjs            # --sans-envoi pour s'arrêter avant la mise en ligne
```

⚠ **Le script REFUSE de déployer** s'il reste un seul chemin qui s'échapperait du
sous-chemin, ou une page sans `noindex`. C'est délibéré : une démo dont les liens
ramènent sur l'agence se découvre trois semaines plus tard, par hasard. Il
sauvegarde aussi `/var/www/kanyro/demo/` avant d'écrire.

> **`git push` ne déploie rien.** Aucun webhook, aucune CI — vérifié. GitHub ne
> sert que de dépôt. La mise en ligne est l'étape ci-dessus, et elle seule.

### Ce que Caddy prend en charge

- **HTTPS et le certificat**, obtenus et renouvelés seuls auprès de
  Let's Encrypt. Le HTTP répond `308` vers HTTPS ; `www.kanyro.tech` est servi
  par le même bloc.
- **Les URL sans slash final**, par `try_files {path} {path}.html {path}/index.html`.
  Astro déclare le canonical `/contact` : le visiteur doit arriver sur cette
  adresse, pas sur `/contact/`.
- **Le cache des assets hashés** (`/_astro/*` en `immutable`, un an) et la
  **compression** (zstd, gzip).
- **La page 404**, par `handle_errors`.
- **Quatre en-têtes de sécurité** : `X-Frame-Options: SAMEORIGIN`,
  `X-Content-Type-Options`, `Referrer-Policy`, et une `Permissions-Policy`
  courte (caméra, micro, géolocalisation). Plus `-Server`, qui retire la
  signature du serveur.

### ⚠ Ce que Caddy N'ENVOIE PAS, et qui manque

**Aucun en-tête `Content-Security-Policy`.** En production, la CSP ne vient donc
QUE de la balise `<meta http-equiv>` de `src/layouts/Base.astro`. Deux
conséquences, à connaître avant de croire le site protégé :

- **`frame-ancestors` est inopérant en `<meta>`**, la spécification l'ignore
  dans cette forme. C'est le `X-Frame-Options: SAMEORIGIN` de Caddy qui tient ce
  rôle — en plus permissif, puisqu'il autorise l'encadrement par le site
  lui-même là où la directive disait `'none'`.
- **`upgrade-insecure-requests` n'est émis nulle part** : la balise l'exclut
  volontairement (voir plus bas), et il n'y a plus d'en-tête HTTP pour le
  porter.

**Ni la `Permissions-Policy` longue** (quatorze API refusées) que décrivait
l'ancienne configuration Apache. **Ni HSTS** — mais celui-là n'a jamais été
envoyé : il était déjà commenté dans le `.htaccess`, volontairement.

> **Le bon endroit pour corriger tout cela est le `Caddyfile`**, dans le bloc
> `header` du site. Y déplacer la CSP la rendrait complète, et rendrait la
> balise `<meta>` superflue. Tant que ce n'est pas fait, ne pas se fier à ce que
> raconte `public/.htaccess`.
>
> **HSTS s'ajoute au même endroit, et seulement une fois** le certificat
> vérifié : l'en-tête envoyé, le navigateur refuse le HTTP pendant un an, même
> si vous faites machine arrière.

### ⚠ `public/.htaccess` n'est plus lu par personne

Le fichier date de l'hébergement mutualisé OVH, où Apache l'exécutait. Il est
conservé dans le dépôt, mais **Caddy l'ignore entièrement** et le déploiement
l'exclut.

C'est un leurre dangereux : à le lire, on croirait que la CSP, HSTS et la
`Permissions-Policy` longue sont appliqués. Aucun ne l'est. Le supprimer, ou
porter son contenu dans le `Caddyfile`, éviterait qu'on s'y fie.

### Le formulaire

`public/contact.php`, sans dépendance ni service tiers, exécuté par PHP-FPM.
Netlify Forms a été abandonné : sa détection se fait au déploiement chez
Netlify, donc partout ailleurs le formulaire postait dans le vide.

**Le courrier part par le Postfix du VPS**, pas par un `mail()` d'hébergeur
mutualisé : `mail.kanyro.tech` a son propre bloc dans le `Caddyfile`, dont le
certificat Let's Encrypt est partagé avec Postfix et Dovecot par
`/usr/local/bin/sync-mail-certs.sh`. Les adresses se règlent en haut de
`contact.php` et doivent rester cohérentes avec `SITE.contact.email` dans
`src/config/site.js` — les trois valent `contact@kanyro.tech`.

> ⚠ L'en-tête de `contact.php` décrit encore les contraintes d'OVH et une
> adresse d'expédition en `elio-pallois.fr`, héritées de la bêta. Le code, lui,
> est à jour ; seuls les commentaires sont à reprendre.

En cas d'échec, le visiteur est renvoyé sur `/contact?erreur=<motif>` — `saisie`,
`limite` ou `envoi` — et `effets.js` dévoile le bandeau correspondant en
restaurant ce qu'il avait tapé. Un échec silencieux sur l'unique chemin de
conversion serait le pire des scénarios ; un message qui accuse le serveur alors
que l'adresse était mal tapée n'est guère mieux.

Le formulaire renvoie aussi un **accusé de réception** au visiteur, ce qui impose
une **limite de 5 envois par heure et par IP** : sans elle, on soumet l'adresse
d'un tiers en boucle et c'est le domaine expéditeur qui finit sur les listes
noires.

**Validation vivante.** Chaque champ signale lui-même son état pendant la saisie
— coche verte quand il est bon, pastille orange et une phrase quand il ne l'est
pas — plutôt que de laisser la faute se découvrir après l'aller-retour serveur.
L'affichage vient de la ressource Osmo « Live Form Validation (Advanced) », le
comportement est dans `initValidationDevis` (`effets.js`) et les styles dans la
section « Le formulaire » de `global.css`, qui détaille ce qui a été refait.

Un champ n'affiche une erreur qu'une fois quitté une première fois, ou à
l'envoi : signaler « adresse invalide » au troisième caractère d'une adresse en
cours de frappe, c'est reprocher au visiteur de ne pas avoir fini. La réussite,
elle, s'affiche immédiatement.

**Tester l'envoi en local.** Le serveur d'Astro sert `public/` en statique : sans
rien, `/contact.php` était renvoyé en clair, et envoyer le formulaire affichait
le code source du script au lieu de `/merci`. `scripts/php-dev.mjs` lance donc un
serveur PHP avec `astro dev` et ne lui confie que `/contact.php` — le script
exécuté est le vrai, celui qui partira en production. Rien à faire de plus que
`npm run dev`, à condition d'avoir PHP sur la machine ; sinon le greffon se
retire en le disant.

`mail()` échouant sur la plupart des postes, faute de serveur de courrier,
l'envoi aboutit en local sur `?erreur=envoi` : c'est le bon résultat, il prouve
que tout a fonctionné jusqu'à la remise au système. Le greffon ne s'active
**qu'en développement** ; en production, c'est le serveur qui exécute le PHP.

⚠ **Le bouton reste un vrai bouton d'envoi.** La ressource d'origine cache le
`<input type="submit">` derrière un faux bouton et n'envoie que par JavaScript :
script bloqué, formulaire mort. Ici `novalidate` est posé *depuis* le script, de
sorte qu'un visiteur sans JavaScript garde les contrôles natifs du navigateur et
un formulaire qui part. `contact.php` revalide les mêmes règles de toute façon.

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
> La vraie serrure est le mot de passe HTTP. Le bloc commenté en haut de
> `public/.htaccess` ne sert plus à rien depuis le passage à Caddy : c'est
> `basic_auth` qu'il faut poser dans le bloc du site, avec une empreinte
> produite par `caddy hash-password`.

**⚠ Servir la bêta depuis un sous-dossier ne marchera pas.** Le site génère des
chemins absolus (`/_astro/…`, `/contact.php`, `/merci`) et la configuration
s'applique à la racine d'un domaine. Il faut un sous-domaine, donc un bloc de
site à part dans le `Caddyfile`.

**Le jour de l'ouverture :** passer `actif` à `false`. L'URL, les canonical, le
sitemap, les `noindex` et le `robots.txt` rebasculent ensemble. Restent trois
choses que ce fichier ne pilote pas — les adresses en haut de `contact.php`,
`SITE.contact.email`, et le `basic_auth` du `Caddyfile` à retirer.

---

### Si vous migrez un jour chez Cloudflare

Cloudflare Pages est une piste envisagée pour plus tard. Trois choses tombent
le jour où vous basculez, et il vaut mieux le savoir avant :

1. **La configuration du serveur est à réécrire.** Le `Caddyfile` ne part pas
   avec le dépôt. Les en-têtes, le cache et la règle d'URL sans slash final se
   redéclarent dans un fichier `public/_headers` (même syntaxe chez Netlify, si
   la question se reposait). Occasion de porter enfin la CSP dans un en-tête
   HTTP plutôt que dans la balise `<meta>`.
2. **`contact.php` ne s'exécute pas.** Cloudflare Pages ne sert pas de PHP. Le
   formulaire doit être recâblé sur une Pages Function, et l'envoi de mail passe
   par un service tiers (Resend, MailChannels) puisqu'il n'y a plus de Postfix
   local. Prévoir aussi `form-action` et `connect-src` dans la CSP en
   conséquence.
3. **Les mentions légales changent.** `SITE.legal.hebergeur` doit nommer
   l'hébergeur RÉEL : l'article 19 de la LCEN l'impose. Il déclare aujourd'hui
   Hostinger, ce qui est juste tant que le site vit sur ce VPS.

Tant que ce n'est pas fait, **ne déployez pas ce dépôt ailleurs** : le
formulaire tomberait en 404 sans aucun message d'erreur, et l'unique chemin de
conversion du site serait mort sans que rien ne le signale.

---

### `upgrade-insecure-requests`

Cette directive doit être portée par un **en-tête HTTP**, jamais par la balise
`<meta>`. Dans le HTML elle partirait partout, y compris là où HTTPS n'est pas
actif — certificat non provisionné, préproduction, test depuis une IP du réseau
local. Le navigateur irait alors chercher `https://…/_astro/style.css` sur un
serveur qui ne parle pas HTTPS, et la page s'afficherait en HTML brut.

Le piège est que tout fonctionne sur `localhost`, que la spécification exempte
des adresses de bouclage : le symptôme n'apparaît qu'une fois déployé.

**⚠ Elle n'est donc émise nulle part aujourd'hui.** L'en-tête qui la portait
était celui du `.htaccess`, que Caddy ne lit pas. La conséquence est faible —
tout le site est en même origine et servi en HTTPS — mais c'est une raison de
plus de déplacer la CSP dans le `Caddyfile`, où cette directive retrouverait sa
place.

---

## Périmètre actuel : vitrine courte, 5 pages

Une offre, un prix, un délai, une preuve honnête, un appel à l'action. Rien
d'autre, et c'est délibéré : construire davantage avant d'avoir vendu repousse le
moment de vendre.

| Page | Rôle |
|---|---|
| `/` | Porte tout : offre, prix, délai, déroulement, forfait Suivi, questions, preuve, appel à l'action |
| `/contact` | Formulaire de demande de devis |
| `/mentions-legales` | Obligations légales |
| `/merci`, `/404` | Techniques, `noindex` |

**Ce qui est écrit mais désactivé** — les 6 pages métier, les 36 pages
« métier × commune » et la galerie de réalisations. Le code est intact ; seuls
deux booléens de `FONCTIONS` dans `src/config/site.js` les éteignent, et
`getStaticPaths` renvoie une liste vide. Les rallumer après le premier ou le
deuxième vrai client est une ligne à changer, pas un chantier à refaire.

**Le forfait Suivi a sa propre section en vitrine.** C'est l'abonnement
d'hébergement et de maintenance proposé après la création : 25 €/mois ou
250 €/an, à partir de la fin de la première année. Décidé le 30 août 2026 sur la
branche `feat/forfait-suivi-mensuel`, jamais fusionnée, il a été repris et mis
en vitrine le 11 septembre. `Suivi.astro` le présente en entier — les deux
montants, les cinq prestations, les deux délais d'engagement, les conditions de
sortie et l'alternative à ~30 €/an.

Un second prix sur la même page est le risque décrit au point 2.2 de la
tasklist : deux tarifs sans règle qui les relie, et le prospect n'en retient
qu'une chose — que le prix se négocie. **La règle est donc écrite à deux
endroits, et retirer l'un des deux rouvre le problème :**

1. `Offre.astro`, sous le prix du site, annonce le forfait et pointe vers
   `#suivi` — comme il annonce déjà le tarif de lancement. Un prix récurrent
   découvert trois sections plus bas se lit sinon comme un supplément caché.
2. `Suivi.astro` rappelle que la première année est comprise dans le prix du
   site. Les deux montants ne portant pas sur la même période, ils ne sont
   jamais en concurrence.

Les montants ne sont écrits qu'une fois, dans `src/data/offres.js`, et lus par
les trois endroits qui les affichent — section Suivi, section Offre et Q&R. Un
prix qui vit à trois endroits finit par diverger, et c'est le devis qui fait foi.

Le forfait a été ouvert **avant** la mesure du rythme mensuel réel sur un premier
client, contrairement à ce qui était prévu. Ce qui borne le risque n'est donc pas
la mesure mais le dimensionnement de `inclus` : le fichier porte le calcul de
marge — environ quatre heures de travail par an, dont la moitié consommée par le
relevé mensuel. **Toute prestation ajoutée à cette liste doit être retranchée de
ces quatre heures**, sinon le forfait se vend à perte sans que rien ne le signale
avant la fin de l'année.

Le palier retenu impose un engagement de délai écrit — réponse et remise en ligne
sous 24 heures ouvrées, dans l'annexe de `docs/devis-modele.md`. C'est lui qui
sépare le forfait d'une revente d'hébergement avec marge, face aux ~30 €/an que
coûte un hébergement repris en main. Si le nombre de clients rend ces délais
douteux, c'est le nombre de forfaits qu'il faut plafonner, pas le délai qu'il faut
allonger.

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
- [ ] Redirection `kaniro.fr` à ajouter dans le `Caddyfile` si le domaine
      défensif est réservé — le nom sera mal orthographié à l'oral (« Kaniro »).
      Mieux vaut une redirection 301 qu'un second site à maintenir.
- [x] Chantier de référence — l'atelier de reliure Frédérique Deranty, publié
      dans `/realisations`. ⚠ La fiche dit qu'il s'agit d'une **maquette livrée
      et pas encore en ligne**, et la section « Preuve » de l'accueil le répète :
      c'est ce qui la distingue d'une fausse référence, et ça ne tient que tant
      que les deux textes disent la même chose. Le jour de la mise en ligne,
      renseigner `enLigne` et la date dans
      `src/content/realisations/atelier-reliure-deranty.md` — la mention
      « maquette livrée en <mois> » bascule alors d'elle-même en
      « mis en ligne en <mois> », et le lien « voir le site » apparaît.
- [ ] Accord de l'artisane pour publier son nom sur le site de l'agence.

---

## Décisions structurantes

**Sortie statique, deux scripts, 20,5 Ko gzip en tout.** Le site vend du
référencement local : il ne peut pas dépendre du client pour afficher son
contenu. `public/js/effets.js` (14,9 Ko gzip — il n'est pas minifié, voir
plus bas, et c'est surtout du commentaire) porte les révélations, la frise du
déroulement, la parallaxe, la barre de navigation, le curseur magnétique et la
validation du formulaire ; `<ClientRouter />` d'Astro (5,6 Ko) enchaîne les
pages en fondu. Tout est décoratif, à une exception près : la
densité de la barre de navigation, qui relève de la lisibilité — d'où un CSS qui
part de l'état lisible et un script qui ne fait que l'éclaircir.

Aucune dépendance d'animation. GSAP, ScrollTrigger, Lenis et Barba ont été
regardés puis écartés : ~40 Ko pour la première paire, un `<head>` à recoller à
la main pour la seconde, et un scroll à inertie qui se paie cher sur les
téléphones de la cible.

Trois ressources Osmo ont été reprises, et les trois ont dû être remotorisées
pour la même raison — leurs dépendances sont servies par un CDN, que
`script-src 'self'` refuse. Le libellé des boutons (« Button 004 ») se passe de
SplitText, la validation du formulaire n'a jamais eu besoin de JavaScript tiers,
et le curseur magnétique remplace GSAP et son greffon Flip par une boucle
amortie et un FLIP écrit à la main : mesurer avant, déplacer, mesurer après,
animer l'écart. Dans les trois cas, la ressource servait de plan, pas de
bibliothèque.

**Deux effets de survol, et un partage clair.** L'aimantation du curseur est
automatique sur tous les boutons — `.bouton-primaire`, `.bouton-secondaire`, et
tout ce qui porte `data-curseur-cible`. L'échange de lettres, lui, se demande
explicitement par `data-bouton-anime` et n'est posé que sur les
« Demander un devis » : c'est le geste de l'unique chemin de conversion, et il
perdait tout son poids à se jouer aussi sur « Retour à l'accueil » ou
« Revoir l'offre ». L'effet suit le libellé, pas la classe.

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

**Zéro style inline dans le balisage.** Les délais d'animation passent par la
variable `--retard`, les fonds par des `<img>` positionnées. Ça permet de garder
`style-src` sans `'unsafe-inline'` malgré la richesse visuelle — `style-src`
régit les attributs `style` écrits dans le HTML, pas les écritures par le CSSOM,
dont vivent la parallaxe, les cascades et la frise.

⚠ Un délai ne s'écrit JAMAIS en `animation-delay`. Les règles d'animation vivent
hors `@layer`, leur raccourci `animation:` remet le délai à zéro, et le hors
couche l'emporte sur `@layer utilities` : les 46 `[animation-delay:…]` du site
étaient silencieusement écrasés, et aucune des cascades n'a jamais existé. Le
détail est en tête du bloc « Animations » de `global.css`.

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
| En-têtes HTTP, redirections | `/etc/caddy/Caddyfile` — **hors du dépôt** |

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
- Le script d'effets se charge et déclenche les 51 révélations de l'accueil,
  à 1 440 px comme à 390 px de large (remesuré le 11/09/2026, après l'ajout de
  la section Suivi et le retrait de trois questions)
- Aucun lien mort, toutes les ancres de la navbar résolvent
- Prix, tarif de lancement et délai présents dans le HTML statique
- Forfait Suivi : section `#suivi` rendue, « 25 €/mois » trois fois (section
  Offre, section Suivi, Q&R) et « 250 €/an » deux fois. Tous lus depuis
  `offres.js` — si un seul de ces nombres diverge, c'est qu'un texte a été
  écrit en dur quelque part
- Contenu intégralement lisible sans exécuter de JavaScript
- `canonical` et `og:url` sur l'URL propre, alignés sur le sitemap
- Sitemap réduit à `/` et `/contact` ; pages `noindex` exclues
- Aucun débordement horizontal
- Vidéo, fontes et images externes chargées sans violation de CSP
