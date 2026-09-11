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
**Caddy du système** depuis `/var/www/kanyro`. La configuration active est
`/etc/caddy/Caddyfile` ; sa version de référence est dans le dépôt, sous
`deploy/caddy/` (voir « La configuration Caddy » plus bas). `contact.php` est
exécuté par PHP-FPM 8.3 via `unix/run/php/php-fpm.sock`.

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

**`--exclude '.htaccess'` reste une ceinture de sécurité.** Le fichier a été
retiré du dépôt le 11 septembre 2026 (il datait d'Apache, que Caddy ne lit
pas) ; s'il revenait un jour dans `public/`, Caddy le SERVIRAIT comme un fichier
ordinaire, et `https://kanyro.tech/.htaccess` publierait sa configuration.

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

### La configuration Caddy

`deploy/caddy/Caddyfile` est la version du dépôt de `/etc/caddy/Caddyfile` ;
`deploy/caddy/kanyro.caddy` porte ce qui est propre au site, en trois extraits
réutilisables (en-têtes, CSP, site). **Rien de ce dossier ne s'applique seul** :
tant qu'il n'a pas été copié, le serveur garde l'ancienne configuration.

```bash
sudo cp deploy/caddy/Caddyfile deploy/caddy/kanyro.caddy /etc/caddy/
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy

curl -sI https://kanyro.tech/          # strict-transport-security, content-security-policy, pas de server:
curl -sI https://kanyro.tech/nimporte  # 404, mêmes en-têtes, cache-control: no-store
curl -sI https://www.kanyro.tech/      # 308 vers https://kanyro.tech/
```

Ce qu'elle fait :

- **HTTPS et le certificat**, obtenus et renouvelés seuls auprès de
  Let's Encrypt. Le HTTP répond `308` vers HTTPS.
- **`www.kanyro.tech` redirige** en 301 vers `kanyro.tech`, au lieu de servir
  une seconde copie du site en 200.
- **Les URL sans slash final**, par `try_files {path} {path}.html {path}/index.html`,
  et une redirection permanente de `/contact/` vers `/contact` (requête
  conservée), comme de `/index.html` vers `/`. Astro déclare le canonical
  `/contact` : il ne doit exister qu'une adresse par page. `/demo/*` est exclu
  de la règle, la démo ayant ses propres chemins.
- **Le cache** : `/_astro/*` en `immutable` (un an, noms hashés), `/js/*` un
  jour, `/images/*` une semaine. La 404 est en `no-store`, jamais en
  `immutable`. Compression zstd et gzip.
- **La 404**, par `handle_errors`, avec les mêmes en-têtes de sécurité que les
  pages normales (ils ne s'y appliquaient pas).
- **Les en-têtes de sécurité** : HSTS (un an, sans `preload` ni
  `includeSubDomains`, voir plus bas), `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, une `Permissions-Policy` qui
  refuse huit API (caméra, micro, géolocalisation, paiement…), et `-Server`
  qui retire la signature du serveur.
- **La CSP en en-tête HTTP**, identique à la balise `<meta>` de
  `src/layouts/Base.astro`, plus les deux directives que la balise ne peut pas
  porter : `frame-ancestors 'none'` (ignoré en `<meta>`) et
  `upgrade-insecure-requests` (voir plus bas). Elle n'est pas envoyée sous
  `/demo/*`, dont le site a sa propre politique.

⚠ **Les deux CSP doivent rester identiques.** Un hôte ajouté dans `Base.astro`
sans l'être dans `kanyro.caddy` (ou l'inverse) est bloqué en production, où les
deux s'appliquent et où c'est la plus stricte qui gagne.

⚠ **HSTS ne se retire pas.** Une fois l'en-tête reçu, le navigateur refuse le
HTTP pendant un an, même si vous faites machine arrière. Il n'est envoyé que
parce que le certificat de `kanyro.tech` est vérifié. `includeSubDomains` n'est
pas posé : un futur sous-domaine servi en HTTP seul serait coupé net.

`Cross-Origin-Opener-Policy` a été essayé puis retiré : il faisait changer de
processus de rendu à chaque page, et le navigateur de test perdait alors ses
caractéristiques de pointeur (Lenis et les survols ne se chargeaient plus).
Sans fenêtre ouverte vers un tiers, il n'apportait presque rien.

**Tester en local**, sans toucher au Caddy du système :

```bash
npm run build
KANYRO_DIST=$PWD/dist caddy run --config deploy/caddy/essai-local.Caddyfile
# http://127.0.0.1:8088 : le site ; http://127.0.0.1:8089 : le test de la redirection www
```

`essai-local.Caddyfile` importe le même `kanyro.caddy` que la production, sans
HTTPS. Il sert l'essai des en-têtes, des redirections et du cache, pas celui
du formulaire.

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

En cas d'échec, le visiteur est renvoyé sur `/contact?erreur=<motif>` — `saisie`,
`limite` ou `envoi` — et `effets.js` dévoile le bandeau correspondant en
restaurant ce qu'il avait tapé. Un échec silencieux sur l'unique chemin de
conversion serait le pire des scénarios ; un message qui accuse le serveur alors
que l'adresse était mal tapée n'est guère mieux.

Le formulaire renvoie aussi un **accusé de réception** au visiteur, ce qui impose
une **limite de 5 envois par heure et par IP** : sans elle, on soumet l'adresse
d'un tiers en boucle et c'est le domaine expéditeur qui finit sur les listes
noires.

**L'accusé de réception est générique.** Il ne reprend ni le nom ni le message
saisis : l'adresse du destinataire est tapée par le visiteur, sans aucune
vérification, et un accusé qui recopiait le texte du formulaire permettait
d'envoyer, depuis `contact@kanyro.tech`, un message de son choix à n'importe
qui. Il dit seulement que la demande est arrivée, et quoi faire si l'on n'a
rien demandé. Plus d'en-tête `X-Mailer` non plus : il annonçait la version de
PHP.

**Le sel du quota** rend imprévisible le nom des fichiers de comptage, posés
dans le `/tmp` partagé de la machine (le détail est en tête de
`contact.php`). Il se règle une fois, dans le pool PHP-FPM :

```bash
openssl rand -hex 32   # à coller ci-dessous
sudoedit /etc/php/8.3/fpm/pool.d/www.conf
#   env[KANYRO_SEL_QUOTA] = <les 64 caractères>
sudo systemctl reload php8.3-fpm
```

Sans la variable, le script tire un secret au hasard à la première demande et
le garde dans `/tmp/kanyro-sel-quota.secret`, lisible par le seul compte de
PHP-FPM (`www-data`). ⚠ Si ce fichier appartient à un autre compte (créé par
un test lancé à la main, par exemple), il est refusé et le quota ne tient plus
d'une demande à l'autre : le supprimer, il sera recréé au bon propriétaire.

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

### Le mode bêta (éteint)

Le site a d'abord tourné sur le domaine personnel. Le basculement est piloté par
un seul objet, `BETA` dans `src/config/site.js`, qui vaut aujourd'hui
`actif: false` : le site est servi et annoncé sur `https://kanyro.tech`.

S'il fallait rouvrir une préproduction, `actif: true` fait basculer ensemble :

- `SITE.url` sur l'adresse de bêta (canonical, `og:url` et sitemap annoncent
  l'adresse réellement servie) ;
- **toutes** les pages en `noindex`, accueil compris ;
- `robots.txt` (généré par `src/pages/robots.txt.js`) en `Disallow: /`, sans
  sitemap annoncé.

> **`robots.txt` ne ferme rien.** C'est une demande, que les robots sont libres
> d'ignorer, et un simple lien partagé suffit à faire entrer l'URL dans l'index.
> La vraie serrure est le mot de passe HTTP : `basic_auth` dans le bloc du site
> de préproduction, avec une empreinte produite par `caddy hash-password`.

**⚠ Servir une bêta depuis un sous-dossier ne marchera pas.** Le site génère des
chemins absolus (`/_astro/…`, `/contact.php`, `/merci`) et la configuration
s'applique à la racine d'un domaine. Il faut un sous-domaine, donc un bloc de
site à part dans le `Caddyfile`.

---

### Si vous migrez un jour chez Cloudflare

Cloudflare Pages est une piste envisagée pour plus tard. Trois choses tombent
le jour où vous basculez, et il vaut mieux le savoir avant :

1. **La configuration du serveur est à réécrire.** `deploy/caddy/kanyro.caddy`
   ne s'y lit pas. Les en-têtes (CSP et HSTS compris), le cache et les
   redirections se redéclarent dans `public/_headers` et `public/_redirects`
   (même syntaxe chez Netlify, si la question se reposait), en recopiant ce que
   fait `kanyro.caddy`, ligne à ligne.
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

**Elle est donc portée par l'en-tête CSP de `deploy/caddy/kanyro.caddy`**, et
seulement là. L'en-tête ne part qu'une fois cette configuration copiée sur le
serveur ; d'ici là, elle n'est émise nulle part, comme avant (l'ancien
`.htaccess` qui la portait n'était pas lu par Caddy).

---

## Périmètre actuel : une vitrine, ses pages métier et une réalisation

Une offre, un prix, un délai, une preuve honnête, un appel à l'action. Rien
d'autre, et c'est délibéré : construire davantage avant d'avoir vendu repousse le
moment de vendre.

| Page | Rôle |
|---|---|
| `/` | Porte tout : offre et prix, réalisation, qui suis-je, déroulement, forfait Suivi, questions, appel à l'action |
| `/contact` | Téléphone et email d'abord, puis le formulaire de demande de devis |
| `/realisations`, `/realisations/atelier-reliure-deranty` | La réalisation livrée, avec ses captures |
| `/metiers` et six pages métier | Une page par métier du bâtiment couvert |
| `/mentions-legales` | Obligations légales et données personnelles |
| `/merci`, `/404` | Techniques, `noindex` |

Le sitemap compte onze adresses. **Ce qui est écrit mais éteint** : les
36 pages « métier × commune » (`FONCTIONS.pagesCommunes` dans
`src/config/site.js`, voir plus bas pourquoi). Les rallumer est une ligne à
changer, pas un chantier à refaire.

**Le forfait Suivi a sa propre section en vitrine.** C'est l'abonnement
d'hébergement et de maintenance proposé après la création, en deux formules :
Maintenance à 29 €/mois ou 290 €/an, Accompagnement à 59 €/mois ou 590 €/an, à
partir de la fin de la première année et sans engagement de durée. Décidé le 30 août 2026 sur la
branche `feat/forfait-suivi-mensuel`, jamais fusionnée, il a été repris et mis
en vitrine le 11 septembre. `Suivi.astro` le présente en deux cartes-résumés,
puis un tableau comparatif à déplier (les prestations de chaque formule), les
délais d'engagement, les conditions de sortie et l'alternative à ~30 €/an.

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

Vidéo d'accueil, fonds de section : visuels du template de référence, sous
licence commerciale acquise. Ils vivent dans `src/assets/medias/` et passent
par le build (`src/config/medias.js`) : les images sortent en AVIF et WebP à
plusieurs largeurs par le composant `Visuel.astro`, et la vidéo a été
réencodée (6 Mo → 588 Ko, 1 280 × 720, lecture progressive), servie aux seuls
écrans d'au moins 768 px et jamais en économie de données ni en mouvement
réduit. Le nuage peint (1,8 Mo), la colombe et le fond de citation ont été
retirés le 11 septembre 2026.

Ils restent des visuels de template : ciel, nuages et colombes dans la vidéo
d'accueil n'ont rien à voir avec le bâtiment. À remplacer par de vraies photos
dès qu'elles existent : un portrait (emplacement `photoFondateur` dans
`medias.js`, affiché par la section « Qui suis-je » dès qu'il est renseigné),
puis des chantiers réels. **Jamais de photo de banque présentée comme un
chantier ou un client.**

### 2. Le reste

- [ ] **SIREN** dans `src/config/site.js` (`SITE.legal.siren`), et l'**adresse**
      (`SITE.legal.adresse`) : sans eux, les mentions légales sont incomplètes
      (article 19 de la LCEN). La page n'affiche que ce qui est renseigné et
      valide, le build liste les champs manquants dans la console, et un encart
      les rappelle en développement seulement.
- [ ] **Régime de TVA** à confirmer (`SITE.legal.tva`) : `'franchise'` affiche
      « TVA non applicable, article 293 B du CGI » sous les prix. Repris du
      modèle de devis ; si ce n'est pas le bon régime, passer la valeur à
      `'assujetti'` (« Prix hors taxes ») ou `''`.
- [ ] **Téléphone de l'hébergeur** (`SITE.legal.hebergeurTelephone`), demandé par
      la LCEN à côté de son nom et de son adresse.
- [ ] Redirection `kaniro.fr` à ajouter dans le `Caddyfile` si le domaine
      défensif est réservé : le nom sera mal orthographié à l'oral (« Kaniro »).
      Mieux vaut une redirection 301 qu'un second site à maintenir.
- [x] Image de partage : `public/images/partage-kanyro.jpg` (1 200 × 630), tirée
      de `scripts/image-partage.html`. Une page peut en passer une autre par la
      prop `image` du layout.
- [x] Chantier de référence : l'atelier de reliure Frédérique Deranty, publié
      dans `/realisations` avec deux captures de la maquette. ⚠ La fiche et la
      section « Réalisation » de l'accueil disent qu'il s'agit d'une **maquette
      livrée et pas encore en ligne** : c'est ce qui la distingue d'une fausse
      référence, et ça ne tient que tant que les deux textes disent la même
      chose. Le jour de la mise en ligne, renseigner `enLigne` et la date dans
      `src/content/realisations/atelier-reliure-deranty.md`.
- [ ] **Accord écrit de l'artisane** pour publier son nom et les captures. En
      cas de refus, retirer ensemble les captures ET le lien vers la maquette
      (la note est en tête de la fiche).

---

## Décisions structurantes

**Sortie statique, deux scripts, 9,6 Ko gzip en tout.** Le site vend du
référencement local : il ne peut pas dépendre du client pour afficher son
contenu. `src/scripts/effets.js` (4 Ko gzip une fois minifié par le build)
porte les révélations, la frise du déroulement, la vidéo d'accueil, la barre de
navigation, la validation du formulaire et les points de mesure ;
`<ClientRouter />` d'Astro (5,5 Ko) enchaîne les pages en fondu. Tout est décoratif, à une exception près : la
densité de la barre de navigation, qui relève de la lisibilité — d'où un CSS qui
part de l'état lisible et un script qui ne fait que l'éclaircir.

Une seule dépendance d'animation, et pas pour tout le monde. GSAP,
ScrollTrigger et Barba ont été regardés puis écartés : ~40 Ko pour la première
paire, un `<head>` à recoller à la main pour la seconde. Lenis (le défilement
amorti, 5,3 Ko gzip, `public/js/lenis.min.js`) n'est chargé qu'avec une souris
(`(hover: hover) and (pointer: fine)`) et sans préférence de mouvement réduit :
un défilement à inertie se paie cher sur les téléphones de la cible, qui ne le
téléchargent donc pas. La parallaxe a été retirée le 11 septembre 2026.

Plusieurs ressources Osmo ont été reprises, et celles qui dépendaient d'un CDN
ont dû être remotorisées, puisque `script-src 'self'` le refuse. Le libellé des
boutons (« Button 004 ») se passe de SplitText, l'arc de raccord de GSAP et
ScrollTrigger, et la validation du formulaire n'a jamais eu besoin de
JavaScript tiers. Dans chaque cas, la ressource servait de plan, pas de
bibliothèque.

Le curseur magnétique, remotorisé de la même façon, a été retiré le
11 septembre 2026 : le site garde le curseur du navigateur. Son code reste dans
l'historique et sur la branche `feat/curseur-magnetique`.

**L'échange de lettres se demande, il ne s'hérite pas.** Il est posé par
`data-bouton-anime`, et seulement sur les « Demander un devis » : c'est le geste
de l'unique chemin de conversion, et il perdait tout son poids à se jouer aussi
sur « Retour à l'accueil » ou « Revoir l'offre ». L'effet suit le libellé, pas
la classe.

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
dont vivent les cascades, les arcs et la frise. Les images passent par
`Visuel.astro` (un `<picture>` sans style), pas par `<Picture>` d'Astro, dont
la sortie peut poser des attributs `style` que la CSP bloquerait sans bruit.

⚠ Un délai ne s'écrit JAMAIS en `animation-delay`. Les règles d'animation vivent
hors `@layer`, leur raccourci `animation:` remet le délai à zéro, et le hors
couche l'emporte sur `@layer utilities` : les 46 `[animation-delay:…]` du site
étaient silencieusement écrasés, et aucune des cascades n'a jamais existé. Le
détail est en tête du bloc « Animations » de `global.css`.

**Le script d'effets est bundlé, mais jamais inliné.** Astro inline les scripts
plus petits que `vite.build.assetsInlineLimit`, et un script inline est bloqué
par `script-src 'self'` : en production il ne s'exécutait pas, et les pages
s'affichaient vides (le développement ne le montrait pas, la CSP n'y étant pas
émise). Le script avait donc été servi tel quel depuis `public/`, non minifié,
17,5 Ko gzip dont l'essentiel en commentaires. Il est maintenant importé depuis
`src/scripts/effets.js`, et `assetsInlineLimit: 0` (`astro.config.mjs`)
garantit qu'il sort toujours en fichier. ⚠ Ne pas remonter cette limite.

**La typographie française est posée au rendu.** `src/middleware.js` passe sur
le HTML de chaque page générée : espaces fines insécables avant ? ! ;,
insécables avant : et dans les guillemets, entre un nombre et son unité, entre
les milliers, apostrophes typographiques. Il ne touche ni aux balises, ni aux
attributs, ni au contenu des `<script>` (le JSON-LD garde ses espaces). Les
textes s'écrivent donc normalement, sans insécables à la main.

**Palette nommée par rôle** (`fond`, `surface`, `texte`) et non par teinte. Le
thème est passé du clair au sombre en cours de route ; des noms comme « craie »
ou « encre » gardaient un sens inversé, et un `bg-encre text-craie` sur page noire
donne un bouton invisible. Le rôle survit au changement de thème.

---

## Où toucher quoi

| Besoin | Fichier |
|---|---|
| Nom, coordonnées, zone, réseaux | `src/config/site.js` |
| **SIREN, adresse, TVA, hébergeur** | `SITE.legal` dans `src/config/site.js` |
| **Rallumer pages communes / métiers / réalisations** | `FONCTIONS` dans `src/config/site.js` |
| Médias (vidéo, fonds, portrait) | `src/assets/medias/` et `src/config/medias.js` |
| Palette, typo, boutons, animations | `src/styles/global.css` |
| L'offre, le prix, le tarif de lancement, le Suivi | `src/data/offres.js` |
| Les questions fréquentes (page et JSON-LD) | `src/data/questions.js` |
| Métiers couverts | `src/data/metiers.json` |
| Communes couvertes | `src/data/communes.json` |
| JSON-LD | `src/config/schema.js` |
| Sections de l'accueil | `src/components/sections/` |
| Tous les liens d'appel | `src/components/LienTelephone.astro` |
| Typographie française automatique | `src/middleware.js` |
| En-têtes HTTP, CSP, redirections, cache | `deploy/caddy/kanyro.caddy`, copié dans `/etc/caddy/` |

---

## Les pages « métier × ville »

`src/pages/metiers/[metier]/[commune].astro` génère le produit cartésien des deux
fichiers de données. C'est le principal levier de référencement local, et **c'est
aussi la partie la plus risquée du site.**

Générer N × M pages qui ne diffèrent que par un toponyme substitué correspond à la
définition Google de la *doorway page*. La sanction frappe le domaine entier.

Ce qui protège : chaque commune porte un `contexte` écrit à la main (nature du
bâti, contraintes locales réelles) et chaque métier le sien. Le générateur saute
toute commune dépourvue de `contexte`.

**État au 11 septembre 2026 :** les six pages métier sont en ligne
(`FONCTIONS.pagesMetiers`), les 36 pages par commune restent éteintes
(`FONCTIONS.pagesCommunes`). Six contextes de commune ne suffisent pas à
distinguer 36 pages, et un domaine neuf sans aucune référence dans le bâtiment
est exactement celui que Google soupçonne. Les communes s'affichent en simple
liste sur les pages métier, sans lien. À rallumer quand chaque page aura
quelque chose de propre à dire (un chantier réel dans la commune, par exemple).

> **Règle à tenir :** ne jamais ajouter une commune sans lui écrire un contexte
> propre et véridique. Six bonnes pages valent mieux que soixante vides.

---

## Réalisations

`src/content/realisations/*.md`, avec `brouillon: true` par défaut pour qu'un
exemple ne parte jamais en production. `_gabarit.md` montre la structure. Les
captures vivent dans `src/assets/realisations/` et se déclarent dans le champ
`captures` (image, texte alternatif de dix caractères au moins, appareil).

Une seule fiche publiée : l'atelier de reliure, une maquette livrée, présentée
comme telle. Aucune autre référence, aucun avis, aucun chiffre de résultat tant
qu'ils n'existent pas. Dans un tissu artisanal local, les artisans se
connaissent : une référence inventée se découvre et coûte plus cher qu'elle ne
rapporte.

---

## Mesure d'audience

Aucun outil n'est branché, et les mentions légales le disent (« ce site ne
dépose aucun cookie et n'utilise aucun outil de mesure d'audience tiers »). Les points de mesure sont prêts dans
`src/scripts/effets.js` (`initMesure`) et ne font rien tant qu'aucun outil
n'est chargé :

| Événement | Déclencheur |
|---|---|
| `clic-appel` | un lien d'appel (`data-mesure="appel"`, posé par `LienTelephone`) |
| `clic-devis` | un bouton « Demander un devis » (`data-mesure="devis"`) |
| `formulaire-envoye` | le formulaire part, validation passée |
| `demande-recue` | arrivée sur `/merci`, une fois par visite de la page |

Pour en brancher un (Plausible ou Umami, détectés tels quels) :

1. charger son script **depuis un fichier servi par le site** ou depuis un hôte
   ajouté à `script-src` et `connect-src`, dans la balise de
   `src/layouts/Base.astro` ET dans `deploy/caddy/kanyro.caddy` ;
2. réécrire la section « Cookies » de `src/pages/mentions-legales.astro`, qui
   affirme aujourd'hui qu'il n'y a aucune mesure ;
3. un outil sans cookie (Plausible, Umami) évite le bandeau de consentement ;
   un outil à cookies l'impose.

---

## Vérifications passées

Sur le build de production, le 11 septembre 2026, servi par
`deploy/caddy/essai-local.Caddyfile` (CSP en en-tête ET en balise) :

- 14 pages générées, onze dans le sitemap, une seule balise `h1` par page,
  aucun script ni style inline (hors données JSON-LD)
- Aucun lien interne mort sur les quatorze pages, aucune ancre orpheline,
  aucun `href="#"`
- Accueil en 4G lente simulée (1,6 Mb/s, 150 ms, processeur ×4) : LCP 2,1 s
  (22,6 s avant), 164 Ko transférés au chargement (10 Mo avant), CLS 0 ;
  /contact et la fiche réalisation sous 1,5 s
- Contrastes AA sur le texte des quatorze pages, de 360 à 2 560 px ; aucun
  texte sous 12 px ; cibles tactiles d'au moins 44 px hors liens dans une
  phrase ; aucun débordement horizontal (la barre de navigation débordait de
  6 px à 360 px)
- Tous les liens vers /contact et tous les liens tel: portent leur point de
  mesure
- Prix, tarif de lancement, délai et forfaits présents dans le HTML statique,
  tous lus depuis `offres.js`
- JSON-LD valide : `ProfessionalService` (fondateur, logo, offre et
  fourchette de prix), `FAQPage`, fil d'Ariane ; aucune adresse ni réseau
  fictif
- Contenu intégralement lisible sans exécuter de JavaScript
- `canonical` et `og:url` sur l'URL propre, alignés sur le sitemap
- Aucune erreur dans la console, révélations et frise déclenchées, Lenis chargé
  à la souris seulement, vidéo jamais téléchargée sur mobile
