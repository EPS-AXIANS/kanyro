<?php
/**
 * Traitement du formulaire de devis — hébergement mutualisé OVH.
 *
 * Remplace Netlify Forms, qui ne fonctionne que chez Netlify : la détection du
 * formulaire s'y fait au moment du déploiement. Sur OVH, sans ce fichier, le
 * formulaire postait dans le vide et aucune demande n'était enregistrée.
 *
 * Aucune dépendance, aucun service tiers, aucune modification de la CSP :
 * `form-action 'self'` autorise déjà un envoi vers le même domaine.
 *
 * ⚠ PRÉREQUIS OVH
 * `mail()` n'est accepté que si l'expéditeur appartient au domaine hébergé.
 * $expediteur doit donc être une adresse réellement créée dans votre espace
 * client OVH, sans quoi les messages seront rejetés ou classés en spam.
 */

declare(strict_types=1);

// ── À renseigner ────────────────────────────────────────────────────────────
$destinataire = 'bonjour@kanyro.fr';   // où vous recevez les demandes
$expediteur   = 'bonjour@kanyro.fr';   // doit exister sur le domaine (OVH)
$pageMerci    = '/merci';
$pageErreur   = '/contact?erreur=1';
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

// Seul un POST est légitime : un accès direct au fichier renvoie à l'accueil.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    terminer('/');
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
    terminer($pageErreur);
}

// Garde-fou sur la taille : au-delà, c'est un envoi automatisé.
if (mb_strlen($message) > 5000 || mb_strlen($nom) > 200) {
    terminer($pageErreur);
}

$libellesDispo = [
    'samedi-matin'      => 'Samedi matin',
    'samedi-apres-midi' => 'Samedi après-midi',
    'soir-semaine'      => 'En soirée, en semaine',
    'chantier'          => 'Passez me voir sur le chantier',
];
$dispoLisible = $libellesDispo[$dispo] ?? 'Peu importe';

$sujet = nettoyerEntete(sprintf(
    'Demande de devis — %s%s',
    $nom,
    $entreprise !== '' ? ' (' . $entreprise . ')' : ''
));

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
    'Envoyé depuis le formulaire de kanyro.fr le ' . date('d/m/Y à H:i'),
]);

// `Reply-To` porte l'adresse du visiteur pour qu'un simple « Répondre » lui
// parvienne. `From` reste une adresse du domaine, exigence d'OVH.
$entetes = implode("\r\n", [
    'From: Kanyro <' . $expediteur . '>',
    'Reply-To: ' . nettoyerEntete($email),
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
]);

$envoye = mail(
    $destinataire,
    '=?UTF-8?B?' . base64_encode($sujet) . '?=',
    $corps,
    $entetes,
    '-f' . $expediteur
);

terminer($envoye ? $pageMerci : $pageErreur);
