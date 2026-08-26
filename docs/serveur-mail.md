# Serveur mail kanyro.tech

Serveur de messagerie auto-hébergé sur le VPS Hostinger (`srv1917309.hstgr.cloud`,
IP `45.133.178.165`), aux côtés du site servi par Caddy. Une seule adresse pour
l'instant : `contact@kanyro.tech`, celle qui reçoit les demandes de devis et sert
d'expéditeur à `contact.php`.

## Architecture

| Brique | Rôle | Ports |
|---|---|---|
| **Postfix** | Réception et relais SMTP | 25 (serveur à serveur), 587 (envoi authentifié) |
| **Dovecot** | Lecture IMAP et livraison locale | 143 (IMAP), 993 (IMAPS/TLS) |
| **OpenDKIM** | Signature des messages sortants | milter interne :8891 |
| **Caddy** | Obtient le certificat Let's Encrypt de `mail.kanyro.tech`, partagé avec Postfix/Dovecot | 80/443 |

Flux d'un message reçu : `Internet → Postfix (25) → OpenDKIM (vérification) →
LMTP → Dovecot → /var/mail/vhosts/kanyro.tech/contact/Maildir`.

Flux d'un message envoyé par le formulaire ou un client mail :
`Postfix → OpenDKIM (signature) → Internet`.

## Fichiers importants sur le serveur

| Fichier | Contenu |
|---|---|
| `/etc/postfix/main.cf` | Domaine virtuel `kanyro.tech`, transport LMTP, TLS |
| `/etc/postfix/vmailbox` | Liste des boîtes (`contact@kanyro.tech`) |
| `/etc/dovecot/users` | Comptes IMAP, mots de passe chiffrés (format `CRYPT`) |
| `/etc/opendkim.conf` | Config du signataire |
| `/etc/opendkim/keys/kanyro.tech/mail.private` | Clé privée DKIM |
| `/etc/mail-certs/` | Certificat partagé Postfix/Dovecot |
| `/usr/local/bin/sync-mail-certs.sh` | Recopie le certificat Caddy vers `/etc/mail-certs` |
| `/root/.mail-credentials` | Mot de passe IMAP en clair (ne jamais versionner) |

## Ce qui a été réglé le 26 août 2026

Le serveur était installé mais inutilisable ; quatre blocages levés :

1. **OpenDKIM bouclait sur des redémarrages** : il tournait en root alors que
   les clés lui appartiennent (« key data is not secure »), et systemd ne
   retrouvait pas son fichier PID. Corrigé par `UserID opendkim` dans
   `/etc/opendkim.conf` (attention : le paramètre s'appelle `UserID`, pas
   `User`), ajout de `PidFile` et d'un drop-in `RuntimeDirectory`.
2. **La livraison échouait** : le socket LMTP de Dovecot n'existait pas tant que
   le service n'avait pas été redémarré après sa configuration.
3. **Personne ne pouvait se connecter** : le fichier `/etc/dovecot/users`
   référencé n'existait pas. Le compte `contact@kanyro.tech` a été créé.
4. **Le port 587 n'écoutait pas** bien que déclaré dans `master.cf` ; un
   redémarrage complet de Postfix a suffi.

Vérifications faites : envoi local livré dans la boîte, signature DKIM présente
dans les en-têtes, connexion IMAP + STARTTLS + lecture de l'INBOX OK.

## Reste à faire côté DNS (hPanel Hostinger)

Sans ces enregistrements, les messages partent en spam ou sont refusés. Le MX
existe déjà ; il manque :

| Type | Nom | Valeur |
|---|---|---|
| `A` | `mail` | `45.133.178.165` |
| `TXT` | `@` | `v=spf1 mx ~all` |
| `TXT` | `mail._domainkey` | Clé publique dans `/etc/opendkim/keys/kanyro.tech/mail.txt` |
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:contact@kanyro.tech` |

Et dans la console VPS Hostinger, pointer le **reverse DNS (PTR)** de
`45.133.178.165` vers `mail.kanyro.tech` (actuellement
`srv1917309.hstgr.cloud`). Sans PTR cohérent, Gmail et Outlook rejettent ou
pénalisent.

Une fois l'enregistrement `mail` posé, Caddy obtient seul le certificat Let's
Encrypt et le timer `sync-mail-certs.timer` le pousse à Postfix/Dovecot — le
certificat auto-signé actuel fait afficher des avertissements aux clients mail
jusque-là. Vérifier ensuite avec :

```bash
opendkim-testkey -d kanyro.tech -s mail -vvv   # doit répondre « record found »
```

DMARC est volontairement en `p=none` pour surveiller sans risquer de se
filtrer soi-même ; passer à `quarantine` puis `reject` après quelques semaines
de recul.

## Accéder à la boîte

N'importe quel client mail (Thunderbird, Outlook, app mobile) : serveur
entrant IMAP `mail.kanyro.tech` port 993 TLS, sortant SMTP `mail.kanyro.tech`
port 587 STARTTLS, identifiants = l'adresse complète et le mot de passe stocké
dans `/root/.mail-credentials`. Un webmail type Roundcube peut être ajouté plus
tard si besoin.
