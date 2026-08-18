#!/usr/bin/env node
/**
 * Vérifie qu'un poste est prêt à travailler sur le site.
 *
 * Répond à une question précise : « qu'est-ce qu'il me manque, et quelle commande
 * je tape ? ». Chaque échec est donc accompagné de la commande qui le corrige,
 * pas seulement du constat.
 *
 * Contraintes de conception :
 *
 *   - Aucune dépendance, uniquement des modules Node natifs. Le script doit
 *     tourner AVANT `npm install` — c'est précisément le moment où on en a
 *     besoin.
 *   - Aucune syntaxe récente. Il doit s'exécuter sur la version de Node trop
 *     ancienne qu'il est chargé de signaler : un script qui plante sur
 *     `SyntaxError` au lieu d'afficher « votre Node est trop vieux » est pire
 *     qu'inutile.
 *   - Les versions attendues sont LUES depuis package.json et .nvmrc, jamais
 *     recopiées ici. Deux sources de vérité finiraient par diverger.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

const ESC = '';
const couleurs = process.stdout.isTTY && !process.env.NO_COLOR;
const teinte = (code, texte) =>
  couleurs ? `${ESC}[${code}m${texte}${ESC}[0m` : texte;
const vert = (t) => teinte('32', t);
const rouge = (t) => teinte('31', t);
const jaune = (t) => teinte('33', t);
const gris = (t) => teinte('90', t);
const gras = (t) => teinte('1', t);

/** Exécute une commande et renvoie sa sortie, ou null si elle est absente. */
function sortie(commande, args) {
  try {
    return execFileSync(commande, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: process.platform === 'win32',
    }).trim();
  } catch {
    return null;
  }
}

/** Compare deux versions « x.y.z ». Renvoie -1, 0 ou 1. */
function comparerVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da > db ? 1 : -1;
  }
  return 0;
}

function premiereVersion(texte) {
  const trouve = /(\d+\.\d+(?:\.\d+)?)/.exec(texte || '');
  return trouve ? trouve[1] : null;
}

// ── Ce qui est attendu, lu depuis les fichiers du dépôt ─────────────────────
const pkg = JSON.parse(readFileSync(join(racine, 'package.json'), 'utf8'));
const nodeMini = (
  pkg.engines && pkg.engines.node ? pkg.engines.node : '>=22.12.0'
).replace(/[^\d.]/g, '');
const nvmrc = existsSync(join(racine, '.nvmrc'))
  ? readFileSync(join(racine, '.nvmrc'), 'utf8').trim()
  : null;

// PHP ne sert qu'à contrôler public/contact.php avant de l'envoyer sur le
// serveur. Le site se construit et se prévisualise sans lui, d'où `requis: false`.
const PHP_MINI = '8.1';

const controles = [];

// ── Node ────────────────────────────────────────────────────────────────────
{
  const version = process.versions.node;
  controles.push({
    nom: 'Node.js',
    requis: true,
    ok: comparerVersions(version, nodeMini) >= 0,
    detail: `${version} ${gris(`(minimum ${nodeMini})`)}`,
    reparer: [
      nvmrc
        ? `nvm install && nvm use        ${gris(`# lit .nvmrc, installe Node ${nvmrc}`)}`
        : `nvm install ${nodeMini}`,
      gris('nvm absent ? https://github.com/nvm-sh/nvm'),
      gris('Windows sans WSL : https://github.com/coreybutler/nvm-windows'),
    ],
  });
}

// ── npm ─────────────────────────────────────────────────────────────────────
{
  const version = premiereVersion(sortie('npm', ['--version']));
  controles.push({
    nom: 'npm',
    requis: true,
    ok: Boolean(version),
    detail: version || rouge('introuvable'),
    reparer: [gris('npm est fourni avec Node : réinstallez Node.')],
  });
}

// ── Dépendances du projet ───────────────────────────────────────────────────
{
  const installe = existsSync(join(racine, 'node_modules', 'astro'));
  controles.push({
    nom: 'Dépendances npm',
    requis: true,
    ok: installe,
    detail: installe ? `installées ${gris('(node_modules/)')}` : rouge('absentes'),
    reparer: [
      `npm ci                        ${gris('# respecte package-lock.json à la lettre')}`,
      gris('`npm install` marche aussi, mais il peut faire bouger le lock.'),
      gris('⚠ Installer sous une version de Node trop ancienne récupère les'),
      gris('  mauvais binaires : corriger Node AVANT, sinon supprimer'),
      gris('  node_modules et recommencer.'),
    ],
  });
}

// ── git ─────────────────────────────────────────────────────────────────────
{
  const version = premiereVersion(sortie('git', ['--version']));
  controles.push({
    nom: 'git',
    requis: true,
    ok: Boolean(version),
    detail: version || rouge('introuvable'),
    reparer: [gris('https://git-scm.com/downloads')],
  });
}

// ── PHP (facultatif) ────────────────────────────────────────────────────────
{
  const version = premiereVersion(sortie('php', ['--version']));
  controles.push({
    nom: 'PHP',
    requis: false,
    ok: Boolean(version) && comparerVersions(version, PHP_MINI) >= 0,
    detail: version ? `${version} ${gris(`(minimum ${PHP_MINI})`)}` : jaune('absent'),
    reparer: [
      gris('Facultatif : le site se construit sans. Sert à contrôler'),
      gris('public/contact.php avant de l’envoyer sur le serveur.'),
      `php -l public/contact.php     ${gris('# syntaxe')}`,
      `cd public && php -S 127.0.0.1:8899   ${gris('# rejoue le formulaire')}`,
      gris('Debian/Ubuntu/WSL : sudo apt install php-cli · macOS : brew install php'),
    ],
  });
}

// ── Restitution ─────────────────────────────────────────────────────────────
console.log('');
console.log(gras('  Environnement de travail — Kanyro'));
console.log('');

for (const c of controles) {
  const marque = c.ok ? vert('  ✓') : c.requis ? rouge('  ✗') : jaune('  !');
  console.log(`${marque} ${c.nom.padEnd(18)} ${c.detail}`);
}

const manquantsRequis = controles.filter((c) => c.requis && !c.ok);
const manquantsOptionnels = controles.filter((c) => !c.requis && !c.ok);

for (const c of [...manquantsRequis, ...manquantsOptionnels]) {
  console.log('');
  console.log(`  ${c.requis ? rouge('▸') : jaune('▸')} ${gras(c.nom)}`);
  for (const ligne of c.reparer) console.log(`      ${ligne}`);
}

console.log('');
if (manquantsRequis.length === 0) {
  console.log(
    `  ${vert('Poste prêt.')} ${gris('npm run dev → http://localhost:4321')}`
  );
  console.log('');
  process.exit(0);
}

console.log(
  `  ${rouge(`${manquantsRequis.length} élément(s) manquant(s).`)} ${gris('Corrigez ci-dessus, puis : npm run verifier')}`
);
console.log('');
process.exit(1);
