/**
 * Refabrique et remet en ligne la démonstration du chantier de reliure.
 *
 *     node scripts/deployer-demo-reliure.mjs [--sans-envoi]
 *
 * La démo est le site de l'atelier de reliure — un AUTRE dépôt — servi sous
 * `/demo/reliure-deranty/` de kanyro.tech. C'est ce que vise le lien « voir la
 * maquette » de la fiche de réalisation.
 *
 * ── Pourquoi un script, et pas une commande à recopier ──
 *
 * La manœuvre a trois passes dont deux sont invisibles, et une seule oubliée
 * met en ligne un site dont tous les liens s'échappent vers l'agence. Le script
 * REFUSE de déployer s'il reste un seul chemin non préfixé : mieux vaut un
 * échec bruyant qu'une démo cassée qu'on découvre trois semaines plus tard.
 *
 * ── Les trois passes ──
 *
 * 1. CONSTRUIRE AVEC UN `base`. Une configuration temporaire étend celle du
 *    projet et n'en change que le strict nécessaire. La sienne n'est jamais
 *    touchée : ce dépôt-là vise la racine d'un domaine, et c'est très bien.
 *
 * 2. RÉÉCRIRE LES CHEMINS ABSOLUS. ⚠ ASTRO NE PRÉFIXE QUE CE QU'IL GÉNÈRE.
 *    Les images et les feuilles reçoivent bien le sous-chemin ; les `href`
 *    écrits à la main dans le balisage gardent leur « / » de tête et pointent
 *    donc vers kanyro.tech. Au premier passage : 31 chemins distincts, 305
 *    occurrences. Les chaînes de chemin compilées dans les scripts subissent le
 *    même sort — celles du panneau de transition indexent son libellé par
 *    chemin, et sans préfixe chaque page retombe sur le nom de la maison.
 *
 * 3. POSER `noindex`. Sans lui, Google indexe le futur site de l'atelier sous
 *    le domaine de l'agence, et les deux se font concurrence le jour de la vraie
 *    mise en ligne. ⚠ SURTOUT PAS un `Disallow` dans robots.txt à la place : il
 *    empêcherait le robot de lire le `noindex` qu'on vient de poser.
 *
 * ── Ce que la démo ne fait pas ──
 *
 * Seules les pages publiques sont servies. Le formulaire de rendez-vous et
 * l'espace `/atelier` tournent sur un Worker Cloudflare qui n'existe pas ici :
 * envoyer le formulaire tombe en 404. C'est assumé et dit dans le README.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { homedir } from 'node:os';

const PROJET = join(homedir(), 'orca/workspaces/reliure-fderanty');
const BASE = '/demo/reliure-deranty';
const CIBLE = '/var/www/kanyro' + BASE;
const SORTIE = join(PROJET, 'dist' + BASE);
const CONFIG_DEMO = join(PROJET, 'astro.demo.mjs');

const envoyer = !process.argv.includes('--sans-envoi');

const dire = (m) => console.log(m);
const echouer = (m) => {
  console.error(`\n✗ ${m}\n`);
  process.exit(1);
};

if (!existsSync(PROJET)) {
  echouer(`Le dépôt du projet reliure est introuvable : ${PROJET}
  Le cloner d'abord :  gh repo clone EPS-AXIANS/reliure-fderanty ${PROJET}`);
}

/* ------------------------------------------------------------------------- */
/* 1. Construire avec un sous-chemin                                          */
/* ------------------------------------------------------------------------- */

dire(`▸ Construction de ${relative(homedir(), PROJET)} avec base=${BASE}`);

writeFileSync(
  CONFIG_DEMO,
  `// Fichier ÉCRIT ET SUPPRIMÉ par le script de démo de Kanyro. Ne pas versionner.
import base from './astro.config.mjs';
import { defineConfig } from 'astro/config';

export default defineConfig({
  ...base,
  site: 'https://kanyro.tech',
  base: '${BASE}',
  // Pas de plan de site pour une démonstration : elle n'a pas à être indexée.
  integrations: [],
});
`
);

try {
  execFileSync('npx', ['astro', 'build', '--config', 'astro.demo.mjs'], {
    cwd: PROJET,
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  /* Sans lui, 60 Mo d'originaux pleine résolution partent avec — le projet a son
     propre script pour ça, on ne le réécrit pas. */
  execFileSync('node', ['scripts/nettoyer-dist.mjs'], {
    cwd: PROJET,
    stdio: 'inherit',
  });
} finally {
  rmSync(CONFIG_DEMO, { force: true });
}

if (!existsSync(join(SORTIE, 'index.html'))) {
  echouer(`La construction n'a pas produit ${SORTIE}/index.html`);
}

/* ------------------------------------------------------------------------- */
/* 2. Réécrire les chemins absolus                                            */
/* ------------------------------------------------------------------------- */

/** Tous les fichiers de la sortie dont le contenu peut porter un chemin. */
async function fichiersTexte(racine) {
  const sortie = [];
  for (const e of await readdir(racine, { withFileTypes: true, recursive: true })) {
    if (!e.isFile()) continue;
    if (/\.(html|css|js|json|xml|txt)$/.test(e.name)) {
      sortie.push(join(e.parentPath ?? e.path, e.name));
    }
  }
  return sortie;
}

const fichiers = await fichiersTexte(SORTIE);

/*
 * Les premiers segments d'URL que le site emploie. Déduits de ce qu'il vient de
 * produire plutôt que recopiés : une page ajoutée demain est prise en compte
 * sans que personne n'ait à y penser.
 *
 * `api` et `atelier` s'y ajoutent à la main — ils ne laissent aucun fichier
 * derrière eux, puisqu'ils tournent sur le Worker, mais le balisage les cite.
 */
const racines = new Set(['api', 'atelier']);
for (const e of await readdir(SORTIE, { withFileTypes: true })) {
  racines.add(e.name);
}

/*
 * ⚠ « / » SEUL N'EST PAS RÉÉCRIT, ET C'EST VOULU.
 *
 * Le remplacer dans les scripts toucherait des séparateurs, des expressions
 * régulières et des découpages de chaîne. Dans le balisage il est déjà pris par
 * la règle d'attribut ci-dessous ; et dans la table du panneau de transition, la
 * clé « / » porte le nom de la maison — exactement ce que rend le repli quand
 * aucune clé ne correspond. Le résultat est donc juste des deux côtés.
 */

const dejaPrefixe = (chemin) => chemin === BASE || chemin.startsWith(BASE + '/');

/** Passe A — les attributs du balisage, des feuilles et des scripts. */
const attribut = /(href|src|action|content)="(\/[^"]*)"/g;

/** Passe B — les chaînes de chemin compilées dans les scripts. */
const chaine = new RegExp(
  `(["'\`])(/(?:${[...racines].map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?:[^"'\`]*)?)`,
  'g'
);

let modifies = 0;
for (const f of fichiers) {
  const avant = readFileSync(f, 'utf8');
  let apres = avant.replace(attribut, (tout, attr, chemin) =>
    dejaPrefixe(chemin) ? tout : `${attr}="${BASE}${chemin === '/' ? '/' : chemin}"`
  );
  if (f.endsWith('.js')) {
    apres = apres.replace(chaine, (tout, guillemet, chemin) =>
      dejaPrefixe(chemin) ? tout : `${guillemet}${BASE}${chemin}`
    );
  }
  if (apres !== avant) {
    writeFileSync(f, apres);
    modifies++;
  }
}
dire(`▸ Chemins réécrits dans ${modifies} fichiers`);

/* ------------------------------------------------------------------------- */
/* 3. Poser le noindex                                                        */
/* ------------------------------------------------------------------------- */

const META = '<meta name="robots" content="noindex, nofollow">';

/*
 * ⚠ C'EST LA VALEUR QUI COMPTE, PAS LA PRÉSENCE DE LA BALISE.
 *
 * Certaines pages du projet portent déjà leur propre `robots` — la 404 et la
 * page de remerciement sont en `noindex` de leur côté, et on les laisse
 * tranquilles. Mais une page qui déclarerait `index` passerait pour « déjà
 * traitée » à ne regarder que le nom de la balise, et partirait indexable.
 * Celle-là est réécrite.
 */
const estNoindex = (t) =>
  /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(t);

let marquees = 0;
let corrigees = 0;
for (const f of fichiers.filter((f) => f.endsWith('.html'))) {
  const t = readFileSync(f, 'utf8');
  if (estNoindex(t)) continue;

  if (/<meta[^>]+name="robots"/i.test(t)) {
    writeFileSync(f, t.replace(/<meta[^>]+name="robots"[^>]*>/i, META));
    corrigees++;
    continue;
  }

  const n = t.replace(/(<head[^>]*>)/i, `$1${META}`);
  if (n === t) echouer(`Pas de <head> où poser le noindex : ${f}`);
  writeFileSync(f, n);
  marquees++;
}
dire(
  `▸ ${marquees} pages marquées noindex` +
    (corrigees ? `, ${corrigees} dont le robots disait autre chose` : '') +
    ` (${fichiers.filter((f) => f.endsWith('.html')).length - marquees - corrigees} l'étaient déjà)`
);

/* ------------------------------------------------------------------------- */
/* Contrôle — et refus de déployer si quoi que ce soit manque                 */
/* ------------------------------------------------------------------------- */

const fuites = new Map();
for (const f of fichiers) {
  const t = readFileSync(f, 'utf8');
  for (const [, , chemin] of t.matchAll(attribut)) {
    if (!dejaPrefixe(chemin)) fuites.set(chemin, (fuites.get(chemin) ?? 0) + 1);
  }
  if (f.endsWith('.js')) {
    for (const [, , chemin] of t.matchAll(chaine)) {
      if (!dejaPrefixe(chemin)) fuites.set(chemin, (fuites.get(chemin) ?? 0) + 1);
    }
  }
}

const sansNoindex = fichiers
  .filter((f) => f.endsWith('.html'))
  .filter((f) => !estNoindex(readFileSync(f, 'utf8')));

if (fuites.size || sansNoindex.length) {
  if (fuites.size) {
    console.error('\nChemins qui s\'échapperaient du sous-chemin :');
    for (const [c, n] of [...fuites].sort()) console.error(`  ${n}×  ${c}`);
  }
  if (sansNoindex.length) {
    console.error('\nPages sans noindex :');
    for (const f of sansNoindex) console.error(`  ${relative(SORTIE, f)}`);
  }
  echouer('Rien n\'a été mis en ligne.');
}

dire('▸ Contrôle : aucun chemin ne s\'échappe, toutes les pages sont en noindex');

/* ------------------------------------------------------------------------- */
/* Mise en ligne                                                              */
/* ------------------------------------------------------------------------- */

if (!envoyer) {
  dire(`\n✓ Prêt dans ${SORTIE} — rien n'a été envoyé (--sans-envoi).`);
  process.exit(0);
}

const horodatage = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const sauvegarde = join(homedir(), `kanyro-demo-sauvegarde-${horodatage}.tar.gz`);

if (existsSync(CIBLE)) {
  execFileSync('tar', ['-czf', sauvegarde, '-C', '/var/www/kanyro', 'demo'], {
    stdio: 'inherit',
  });
  dire(`▸ Sauvegarde : ${sauvegarde}`);
}

execFileSync(
  'rsync',
  [
    '-rlt',
    '--delete',
    '--no-perms',
    '--no-owner',
    '--no-group',
    // Fichier de configuration Cloudflare : Caddy ne le lit pas et le servirait.
    '--exclude',
    '_headers',
    SORTIE + '/',
    CIBLE + '/',
  ],
  { stdio: 'inherit' }
);

dire(`\n✓ En ligne : https://kanyro.tech${BASE}/`);
dire('  ⚠ Le formulaire de rendez-vous et /atelier ne fonctionnent pas ici :');
dire('    ils tournent sur un Worker Cloudflare, absent de cette démonstration.');
