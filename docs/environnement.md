# Environnement de travail

Tout ce qu'il faut sur un poste neuf pour reprendre le site, et rien d'autre.

## Sur un poste vierge, en trois commandes

```bash
git clone https://github.com/EPS-AXIANS/kanyro.git
cd kanyro
nvm install && nvm use     # Linux / macOS / WSL — lit .nvmrc
npm ci                     # installe les dépendances du projet
npm run verifier           # contrôle que tout est en place
npm run dev                # http://localhost:4321
```

Sous **Windows hors WSL**, les deux premières lignes changent — voir
[Node.js](#nodejs-24--obligatoire) plus bas :

```bat
nvm install 24
nvm use 24
```

`npm run verifier` liste ce qui manque **et la commande qui le corrige**. C'est
le premier réflexe quand quelque chose ne marche pas sur une machine.

## Récupérer le travail en cours sur un autre poste

Le développement se fait sur des branches, pas sur `main`. Pour reprendre une
branche depuis une autre machine :

```bash
# Le dépôt est déjà cloné sur ce poste
git fetch origin
git switch <nom-de-la-branche>   # la 1re fois : crée le suivi de origin
git pull                         # les fois suivantes

# Poste vierge
git clone -b <nom-de-la-branche> https://github.com/EPS-AXIANS/kanyro.git
cd kanyro
```

Puis, **dans les deux cas** :

```bash
nvm install && nvm use   # au cas où .nvmrc aurait changé (Windows : nvm use 24)
npm ci
npm run verifier
```

> `npm ci` après chaque `pull` qui touche `package.json` ou
> `package-lock.json` — sinon on travaille avec les dépendances de la veille.
> Et toujours **après** `nvm use` : installer sous une version de Node périmée
> récupère les mauvais binaires natifs (voir plus bas).

`git branch -r` liste les branches disponibles sur GitHub si vous ne vous
souvenez plus du nom.

---

## Ce que npm installe tout seul

Il n'y a pas de `requirements.txt` ici : dans l'écosystème Node, ce rôle est
tenu par **`package.json`** (ce dont le projet a besoin) et
**`package-lock.json`** (les versions exactes, aux dépendances transitives
près). Les deux sont versionnés, donc rien à chercher.

| Paquet | Rôle |
|---|---|
| `astro` | Le générateur. Sortie statique, aucun serveur à faire tourner en production |
| `@astrojs/sitemap` | Génère `sitemap-index.xml` au build |
| `tailwindcss` + `@tailwindcss/vite` | Les styles |
| `lucide-astro` | Les icônes du pied de page |

**`npm ci` plutôt que `npm install`.** `ci` reproduit exactement le
`package-lock.json` et repart d'un `node_modules` propre. `npm install` fonctionne
aussi, mais il peut faire bouger le lock au passage — donc introduire une
différence entre deux postes, ce qui est précisément ce qu'on cherche à éviter.

---

## Ce que npm n'installe pas

C'est la partie qu'on cherche habituellement à tâtons.

### Node.js 24 — obligatoire

Astro 7 exige Node ≥ 22.12. La version est fixée dans deux fichiers, qui doivent
rester d'accord : `.nvmrc` (`24`) et le champ `engines` de `package.json`.

**Il existe deux nvm, et ils ne s'utilisent pas pareil.** C'est la source de
confusion la plus fréquente : les commandes trouvées en ligne sont presque
toujours celles du premier.

| | Linux · macOS · WSL | Windows natif |
|---|---|---|
| Outil | [nvm-sh](https://github.com/nvm-sh/nvm) | [nvm-windows](https://github.com/coreybutler/nvm-windows) |
| Lit `.nvmrc` | oui | **non** |
| Installer | `nvm install` | `nvm install 24` |
| Activer | `nvm use` | `nvm use 24` |

Sous nvm-windows, `nvm install` sans argument échoue sur :

```
error installing : A version argument is required but missing
```

Ce n'est pas une panne, c'est la version pour Windows qui attend un numéro
explicite. Deux points à connaître :

- **`nvm use` exige un terminal ouvert en Administrateur** — il déplace un lien
  symbolique dans `C:\Program Files\nodejs`. Sans ça, la commande semble
  réussir mais `node -v` continue d'afficher l'ancienne version.
- Si `nvm install 24` est refusé, donnez le numéro complet : `nvm install
  24.18.0`. Les versions courtes ne sont résolues que par nvm-windows récent.

> Le plus simple sur un poste Windows reste de travailler **dans WSL** : on
> retrouve nvm-sh, `.nvmrc` est lu, et l'environnement est identique à celui du
> serveur. Mais les deux fonctionnent.

> **Le piège à connaître.** Sous une version de Node trop ancienne, `npm install`
> ne refuse pas de s'exécuter : il récupère les mauvais binaires natifs, et le
> build échoue plus tard sur `Cannot find module '@rolldown/binding-wasm32-wasi'`
> — un message qui ne dit à aucun moment que le problème vient de Node.
>
> Si ça arrive : corriger Node, puis `rm -rf node_modules && npm ci`. Changer de
> version de Node ne suffit pas, les binaires déjà installés restent faux.

### PHP 8.1+ — facultatif

Le site se construit et se prévisualise sans PHP. Il ne sert qu'à contrôler
`public/contact.php` avant de l'envoyer sur le serveur :

```bash
php -l public/contact.php              # syntaxe
cd public && php -S 127.0.0.1:8899     # rejoue les redirections du formulaire
```

- Debian / Ubuntu / WSL : `sudo apt install php-cli`
- macOS : `brew install php`

L'envoi de mail, lui, **n'est pas testable en local** : `mail()` a besoin du
serveur OVH. Voir le README.

### git

<https://git-scm.com/downloads>

---

## Ce dont le projet n'a PAS besoin

Autant le dire, ça évite de chercher : **pas de base de données**, pas de Docker,
pas de runtime en production, pas de compte sur un service tiers pour développer.
Le site est statique — le build produit `dist/`, qu'on dépose tel quel.

---

## Accès nécessaires pour déployer

Ceux-là ne s'installent pas, ils se demandent. Sans eux on peut développer, mais
pas mettre en ligne.

| Accès | Sert à |
|---|---|
| Espace client OVH | Déposer `dist/` par FTP dans `www/` |
| Boîte `kanyro@elio-pallois.fr` | Recevoir les demandes de devis — l'expéditeur de `mail()` doit appartenir au domaine hébergé |
| Compte GitHub sur `EPS-AXIANS/kanyro` | Pousser le code |

---

## Réglages d'éditeur

Rien n'est imposé. Deux extensions font gagner du temps sur ce dépôt :

- **Astro** (`astro-build.astro-vscode`) — coloration et complétion dans les
  fichiers `.astro`
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)

Le dépôt contient un `.gitattributes` qui normalise les fins de ligne en LF. Sur
Windows, laisser git faire : ne pas forcer `core.autocrlf`.
