<?php
/**
 * Traitement du formulaire de devis — hébergement mutualisé OVH.
 *
 * Aucune dépendance, aucun service tiers, aucune modification de la CSP :
 * `form-action 'self'` autorise déjà un envoi vers le même domaine.
 *
 * ⚠ PRÉREQUIS OVH
 * `mail()` n'est accepté que si l'expéditeur appartient au domaine hébergé.
 * $expediteur doit donc être une adresse réellement créée dans votre espace
 * client OVH, sans quoi les messages seront rejetés ou classés en spam.
 *
 * Pendant la bêta, c'est `elio-pallois.fr` qui héberge : `$expediteur` doit donc
 * être une adresse de CE domaine. Le jour du passage sur le domaine de l'agence,
 * les trois constantes ci-dessous changent ensemble — une adresse d'expédition
 * qui ne correspond plus au domaine hébergeur est rejetée en silence.
 */

declare(strict_types=1);

// ── À renseigner ────────────────────────────────────────────────────────────
$destinataire = 'kanyro@elio-pallois.fr';   // où vous recevez les demandes
$expediteur   = 'kanyro@elio-pallois.fr';   // doit exister sur le domaine hébergé (OVH)
$siteUrl      = 'https://www.kanyro.fr';    // signature de l'accusé de réception
$pageMerci    = '/merci';

/*
 * Trois motifs d'échec distincts, parce qu'ils n'appellent pas la même phrase.
 * Dire « le problème vient de mon côté » à quelqu'un qui a mal tapé son adresse
 * l'empêche de comprendre qu'il lui suffit de la corriger.
 */
$pageErreurSaisie = '/contact?erreur=saisie';
$pageErreurEnvoi  = '/contact?erreur=envoi';
$pageErreurLimite = '/contact?erreur=limite';

/*
 * Limite d'envoi par adresse IP.
 *
 * Indispensable depuis que le formulaire renvoie un accusé de réception : sans
 * elle, n'importe qui peut soumettre l'adresse d'un tiers en boucle et faire
 * envoyer les mails par ce serveur. La victime reçoit le flot, mais c'est le
 * domaine expéditeur qui se retrouve signalé comme spammeur — et une réputation
 * d'expéditeur se répare beaucoup plus lentement qu'elle ne se casse.
 *
 * Cinq demandes par heure : très au-dessus de ce qu'un artisan fera jamais,
 * très en dessous de ce qui rend l'abus intéressant.
 */
$limiteEnvois = 5;
$fenetreLimite = 3600; // secondes

/*
 * Sel du nom de fichier de quota.
 *
 * Sur un mutualisé, `sys_get_temp_dir()` est `/tmp`, partagé en 1777 avec tous
 * les autres comptes de la machine. Un nom de fichier dérivé de la seule IP est
 * donc devinable : un voisin qui connaît l'IP d'un visiteur peut y déposer
 * d'avance cinq horodatages frais et lui fermer le formulaire pour une heure,
 * renouvelable indéfiniment. Le sel rend le chemin imprévisible.
 *
 * À personnaliser au déploiement — la valeur ci-dessous est publique puisque le
 * dépôt l'est. `KANYRO_SEL_QUOTA` dans l'environnement PHP la remplace si vous
 * préférez la garder hors du dépôt. En changer invalide les fichiers existants,
 * c'est aussi le geste de rotation si vous soupçonnez une fuite.
 */
$selQuota = getenv('KANYRO_SEL_QUOTA') ?: 'kanyro-quota-a-personnaliser';
// ────────────────────────────────────────────────────────────────────────────

/** Redirige et coupe l'exécution. Aucun message d'erreur technique n'est exposé. */
function terminer(string $url): never
{
    header('Location: ' . $url, true, 303);
    exit;
}

/**
 * Neutralise l'injection d'en-têtes.
 *
 * Toute valeur issue du formulaire et placée dans un en-tête (Reply-To, Subject)
 * doit être purgée de ses retours chariot : un « \r\nBcc: ... » injecté dans le
 * champ email transformerait sinon le formulaire en relais à spam.
 */
function nettoyerEntete(string $valeur): string
{
    return trim(str_replace(["\r", "\n", "%0a", "%0d"], '', $valeur));
}

function champ(string $nom): string
{
    return isset($_POST[$nom]) && is_string($_POST[$nom]) ? trim($_POST[$nom]) : '';
}

/**
 * Vrai si la requête ne vient pas d'une page du site lui-même.
 *
 * `form-action 'self'` dans la CSP empêche déjà le formulaire du site de poster
 * ailleurs ; il n'empêche pas le formulaire de quelqu'un d'autre de poster ici.
 * Or ce point d'entrée envoie un accusé de réception signé Kanyro à l'adresse
 * saisie : un tiers qui héberge son propre formulaire pointant sur cette URL
 * s'en sert comme relais d'un mail crédible. Comparer l'origine annoncée à
 * l'hôte servi ferme ce détournement, sans rien changer pour le visiteur.
 *
 * Origin d'abord — le navigateur l'envoie sur toute soumission de formulaire et
 * ne le laisse pas falsifier. Referer en repli, pour les clients plus anciens.
 * Aucun des deux : on laisse passer. Certains proxys d'entreprise et extensions
 * de confidentialité les suppriment, et perdre une vraie demande de devis coûte
 * plus cher que d'accepter un POST forgé de plus — que le quota borne déjà.
 */
function origineEtrangere(): bool
{
    $hote = $_SERVER['HTTP_HOST'] ?? '';
    if (!is_string($hote) || $hote === '') {
        return false;
    }

    $source = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if (!is_string($source) || $source === '') {
        return false;
    }

    $hoteSource = parse_url($source, PHP_URL_HOST);
    if (!is_string($hoteSource) || $hoteSource === '') {
        // « null », « about:blank », ou en-tête illisible : rien qui ressemble
        // à une page du site. On refuse.
        return true;
    }

    $port = parse_url($source, PHP_URL_PORT);
    if (is_int($port)) {
        $hoteSource .= ':' . $port;
    }

    return strcasecmp($hoteSource, $hote) !== 0;
}

/** Encode un sujet en UTF-8, seule forme acceptée partout pour les accents. */
function sujetEncode(string $sujet): string
{
    return '=?UTF-8?B?' . base64_encode(nettoyerEntete($sujet)) . '?=';
}

/**
 * Vrai si l'IP a déjà dépassé son quota sur la fenêtre glissante.
 *
 * Les horodatages sont stockés dans un fichier par IP, dans le répertoire
 * temporaire — pas de base de données à provisionner sur un mutualisé. L'IP est
 * hachée : le fichier ne conserve donc aucune donnée personnelle en clair.
 *
 * En cas d'impossibilité d'écrire (répertoire en lecture seule, quota disque),
 * la fonction laisse passer. Bloquer une vraie demande de devis coûte plus cher
 * que laisser passer un abus, qui reste borné par les filtres en amont.
 */
function quotaDepasse(int $limite, int $fenetre, string $sel): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if ($ip === '') {
        return false;
    }

    // HMAC et non simple hachage : voir le commentaire de $selQuota. Un hachage
    // nu de l'IP se recalcule par quiconque connaît l'IP, et le chemin devient
    // une cible que l'on peut pré-créer dans un /tmp partagé.
    $fichier = sys_get_temp_dir() . '/kanyro-devis-' . hash_hmac('sha256', $ip, $sel) . '.txt';

    $flux = @fopen($fichier, 'c+');
    if ($flux === false) {
        return false;
    }

    /*
     * Deuxième verrou, au cas où le sel fuiterait : un fichier de quota qui ne
     * nous appartient pas n'a pas été écrit par ce script. Son contenu ne dit
     * rien de l'activité du visiteur, seulement ce qu'un tiers veut nous faire
     * croire — on ne le lit pas. Comme partout ailleurs dans cette fonction,
     * l'échec laisse passer : refuser un devis coûte plus cher que l'abus.
     */
    $etat = fstat($flux);
    $nous = function_exists('posix_geteuid') ? posix_geteuid() : getmyuid();
    if (!is_array($etat) || $nous === false || $etat['uid'] !== $nous) {
        fclose($flux);
        return false;
    }

    // Fichier neuf : le refermer sur nous seuls. Les horodatages d'un visiteur
    // n'ont pas à être lisibles par les autres comptes de la machine.
    if ($etat['size'] === 0) {
        @chmod($fichier, 0600);
    }

    try {
        if (!flock($flux, LOCK_EX)) {
            return false;
        }

        $maintenant = time();
        $contenu = stream_get_contents($flux);
        $horodatages = array_filter(
            array_map('intval', preg_split('/\s+/', (string) $contenu, -1, PREG_SPLIT_NO_EMPTY) ?: []),
            static fn (int $t): bool => $t > $maintenant - $fenetre
        );

        if (count($horodatages) >= $limite) {
            return true;
        }

        $horodatages[] = $maintenant;

        ftruncate($flux, 0);
        rewind($flux);
        fwrite($flux, implode("\n", $horodatages));
        fflush($flux);

        return false;
    } finally {
        flock($flux, LOCK_UN);
        fclose($flux);
    }
}

// Seul un POST est légitime : un accès direct au fichier renvoie à l'accueil.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    terminer('/');
}

// Soumission depuis une page qui n'est pas la nôtre : on ne sert pas de relais.
if (origineEtrangere()) {
    terminer($pageErreurSaisie);
}

// Pot de miel : rempli, c'est un robot. On répond comme à un envoi réussi pour
// ne pas lui signaler que le piège a été détecté.
if (champ('bot-field') !== '') {
    terminer($pageMerci);
}

$nom        = champ('nom');
$email      = champ('email');
$message    = champ('message');
$entreprise = champ('entreprise');
$telephone  = champ('telephone');
$metier     = champ('metier');
$dispo      = champ('disponibilite');

// Les trois champs marqués `required` côté HTML — revalidés côté serveur,
// puisque l'attribut HTML se contourne en trois secondes.
if ($nom === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    terminer($pageErreurSaisie);
}

// Garde-fou sur la taille : au-delà, c'est un envoi automatisé.
if (mb_strlen($message) > 5000 || mb_strlen($nom) > 200) {
    terminer($pageErreurSaisie);
}

// Vérifié après la validation, pour qu'une simple faute de frappe corrigée dans
// la foulée ne consomme pas le quota du visiteur.
if (quotaDepasse($limiteEnvois, $fenetreLimite, $selQuota)) {
    terminer($pageErreurLimite);
}

$libellesDispo = [
    'samedi-matin'      => 'Samedi matin',
    'samedi-apres-midi' => 'Samedi après-midi',
    'soir-semaine'      => 'En soirée, en semaine',
    'chantier'          => 'Passez me voir sur le chantier',
];
$dispoLisible = $libellesDispo[$dispo] ?? 'Peu importe';

$corps = implode("\n", [
    'Nom          : ' . $nom,
    'Entreprise   : ' . ($entreprise !== '' ? $entreprise : '—'),
    'Email        : ' . $email,
    'Téléphone    : ' . ($telephone !== '' ? $telephone : '—'),
    'Métier       : ' . ($metier !== '' ? $metier : '—'),
    'Joignable    : ' . $dispoLisible,
    '',
    '--- Message ---',
    $message,
    '',
    '---',
    'Envoyé depuis le formulaire de ' . $siteUrl . ' le ' . date('d/m/Y à H:i'),
]);

// `Reply-To` porte l'adresse du visiteur pour qu'un simple « Répondre » lui
// parvienne. `From` reste une adresse du domaine, exigence d'OVH.
$entetes = implode("\r\n", [
    'From: Kanyro <' . $expediteur . '>',
    'Reply-To: ' . nettoyerEntete($email),
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
]);

$sujet = sprintf(
    'Demande de devis — %s%s',
    $nom,
    $entreprise !== '' ? ' (' . $entreprise . ')' : ''
);

$envoye = mail($destinataire, sujetEncode($sujet), $corps, $entetes, '-f' . $expediteur);

// Le mail au gérant a échoué : la demande est perdue, il faut le dire.
if (!$envoye) {
    terminer($pageErreurEnvoi);
}

/*
 * Accusé de réception au visiteur.
 *
 * La page /merci annonce un email : sans cet envoi, elle mentirait. Il sert
 * aussi de preuve que l'adresse saisie fonctionne, et ouvre le fil de discussion
 * — répondre à un mail existant demande moins d'effort qu'en écrire un.
 *
 * Envoi au mieux : son échec ne doit pas faire croire au visiteur que sa demande
 * n'est pas partie, puisqu'elle l'est. Le gérant a le message, c'est ce qui
 * compte.
 */
$corpsAccuse = implode("\n", [
    'Bonjour ' . $nom . ',',
    '',
    "J'ai bien reçu votre demande. Je vous réponds sous 48 heures, en soirée ou",
    'le samedi.',
    '',
    'Vous pouvez répondre directement à cet email si vous voulez ajouter quelque',
    'chose — une photo de chantier, une précision, une question.',
    '',
    '--- Ce que vous m\'avez écrit ---',
    $message,
    '',
    '---',
    'Elio Pallois — Kanyro',
    'Sites et visibilité pour les artisans du bâtiment',
    $siteUrl,
]);

$entetesAccuse = implode("\r\n", [
    'From: Kanyro <' . $expediteur . '>',
    'Reply-To: ' . $expediteur,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
    // Un accusé de réception ne doit jamais déclencher le répondeur automatique
    // d'en face : deux robots qui se répondent, c'est une boucle.
    'Auto-Submitted: auto-replied',
]);

@mail(
    nettoyerEntete($email),
    sujetEncode('Votre demande est bien arrivée — Kanyro'),
    $corpsAccuse,
    $entetesAccuse,
    '-f' . $expediteur
);

terminer($pageMerci);
