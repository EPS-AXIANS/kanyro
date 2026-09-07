/**
 * Fait tourner `public/contact.php` PENDANT LE DÉVELOPPEMENT.
 *
 * ── Le problème ──
 *
 * Le serveur d'Astro sert `public/` en fichiers statiques. `/contact.php` n'y
 * est donc pas exécuté : il est renvoyé tel quel, sans même un type MIME, et le
 * navigateur affiche le code source du script — accents cassés compris, faute
 * de jeu de caractères annoncé. Envoyer le formulaire en développement donnait
 * cette page de code au lieu de /merci, et il n'y avait aucun moyen de tester la
 * chaîne complète sans déployer.
 *
 * ── Le remède ──
 *
 * Un second serveur, celui de PHP, démarré avec `astro dev` et arrêté avec lui,
 * à qui l'on ne confie QUE `/contact.php`. Tout le reste continue de passer par
 * Astro. Le script exécuté est le vrai, celui qui partira en production : ce qui
 * est vérifié ici est donc ce qui sera servi, et non une imitation en JavaScript
 * qui aurait à être tenue à jour en parallèle.
 *
 * ⚠ NE S'ACTIVE QU'EN DÉVELOPPEMENT (`apply: 'serve'`). Le build ne connaît pas
 * ce fichier, et la production n'a pas de proxy : c'est Apache, ou ce qui sert
 * le site, qui exécute le PHP.
 *
 * Sans PHP sur la machine, le greffon se retire en le disant, et le formulaire
 * retombe sur le comportement d'avant — gênant, mais pas bloquant.
 *
 * ── Ce qui ne se voit pas et qui compte ──
 *
 * Les en-têtes de la requête sont recopiés TELS QUELS vers PHP, `Host` inclus.
 * C'est indispensable : `origineEtrangere()` dans contact.php compare l'hôte de
 * `Origin` à `HTTP_HOST`. Laisser le proxy réécrire `Host` en 127.0.0.1:8099
 * ferait échouer cette comparaison contre `localhost:4321`, et TOUT envoi de
 * développement serait refusé en `?erreur=saisie` — un faux négatif qu'on aurait
 * mis longtemps à imputer au proxy plutôt qu'au formulaire.
 *
 * La redirection 303 est renvoyée telle quelle au navigateur, qui demande
 * ensuite /merci ou /contact?erreur=… à Astro. Exactement le parcours réel.
 *
 * ⚠ `mail()` échoue sur la plupart des postes de développement, faute de serveur
 * de courrier : l'envoi part alors sur `?erreur=envoi`. C'est le bon résultat —
 * il prouve que tout a fonctionné jusqu'à la remise au système.
 */
import { spawn } from 'node:child_process';
import http from 'node:http';

/** Port du serveur PHP. Rien d'autre que ce greffon ne s'y adresse. */
const PORT_PHP = 8099;

/** Le seul chemin détourné vers PHP. */
const CHEMIN = '/contact.php';

export function phpEnDeveloppement() {
  let php = null;
  let disponible = false;

  return {
    name: 'kanyro:php-dev',
    apply: 'serve',

    configureServer(serveur) {
      php = spawn('php', ['-S', `127.0.0.1:${PORT_PHP}`, '-t', 'public'], {
        stdio: 'ignore',
      });

      php.on('spawn', () => {
        disponible = true;
        serveur.config.logger.info(
          `  \x1b[32m➜\x1b[0m  \x1b[1mPHP\x1b[0m:      ${CHEMIN} exécuté (port ${PORT_PHP})`
        );
      });

      /*
       * Le port est déjà pris, ou PHP s'arrête en route : on se retire au lieu
       * de renvoyer une erreur de passerelle. Le formulaire retombe alors sur le
       * comportement d'avant — le fichier servi en clair — ce qui est fâcheux,
       * mais reste préférable à une page 502 qui n'expliquerait rien.
       */
      php.on('exit', () => {
        disponible = false;
      });

      php.on('error', () => {
        disponible = false;
        serveur.config.logger.warn(
          `\n  PHP est absent de cette machine : ${CHEMIN} sera servi en clair,\n` +
            "  comme avant. Le reste du site n'est pas affecté.\n"
        );
      });

      const arreter = () => php?.kill();
      serveur.httpServer?.on('close', arreter);
      process.once('exit', arreter);

      serveur.middlewares.use((requete, reponse, suivant) => {
        // `startsWith` et non l'égalité : une éventuelle chaîne de requête suit.
        if (!disponible || !requete.url?.startsWith(CHEMIN)) return suivant();

        const relais = http.request(
          {
            host: '127.0.0.1',
            port: PORT_PHP,
            path: requete.url,
            method: requete.method,
            headers: requete.headers, // `Host` compris — voir l'en-tête.
          },
          (retour) => {
            reponse.writeHead(retour.statusCode ?? 502, retour.headers);
            retour.pipe(reponse);
          }
        );

        relais.on('error', (erreur) => {
          reponse.statusCode = 502;
          reponse.end(`Le serveur PHP de développement n'a pas répondu : ${erreur.message}`);
        });

        requete.pipe(relais);
      });
    },
  };
}
