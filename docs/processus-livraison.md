# Processus de livraison

Six étapes, 4 à 6 semaines, en soirée et le week-end. L'objectif de ce document
est qu'un chantier se déroule toujours pareil : c'est ce qui fait tomber le temps
passé d'un client au suivant, et c'est ce qui permettra d'industrialiser plus tard.

Le compteur ne démarre qu'une fois **l'acompte reçu et les éléments réunis**. Le
dire au client dès le devis évite le reproche d'un retard qui vient de son côté.

---

## Étape 0 — Avant de commencer

- [ ] Devis signé, mention « Bon pour accord », date et signature
- [ ] Acompte de 30 % encaissé
- [ ] Accès obtenus : nom de domaine existant, fiche Google, ancien site
- [ ] Logo reçu, dans le meilleur format disponible
- [ ] Créneau de reportage photo calé

> **Le point qui fait dérailler les chantiers, c'est l'accès au nom de domaine.**
> Il a souvent été acheté par un tiers injoignable. Le vérifier à l'étape 0, pas
> à la mise en ligne — sinon on découvre le problème le jour du lancement.

## Étape 1 — Cadrage (semaine 1)

- [ ] Questionnaire de cadrage rempli en rendez-vous → `questionnaire-client.md`
- [ ] Arborescence des 5 pages arrêtée
- [ ] Liste des recherches visées : métier × communes réellement couvertes
- [ ] Textes rédigés à partir des mots du client, pas des miens
- [ ] Textes envoyés pour validation **avant** toute mise en forme

> Faire valider les textes seuls, sans design. Un client à qui on montre une
> maquette ne lit plus les textes : il regarde les couleurs.

## Étape 2 — Reportage photo (semaine 1 ou 2)

- [ ] Une demi-journée, 2 à 3 chantiers finis
- [ ] Lumière : tôt le matin ou fin d'après-midi, jamais en plein midi
- [ ] Prévoir des plans larges et des détails d'exécution
- [ ] Photographier aussi l'artisan au travail, avec son accord
- [ ] Autorisation du propriétaire si le chantier est chez un particulier
- [ ] Tri, recadrage, export en WebP

## Étape 3 — Réalisation (semaines 2 à 4)

- [ ] Site monté sur le socle Astro
- [ ] Formulaire de devis branché et testé
- [ ] Numéro de téléphone cliquable sur mobile
- [ ] Mentions légales complètes : SIREN, assurance décennale, hébergeur
- [ ] JSON-LD `LocalBusiness` renseigné avec les vraies coordonnées
- [ ] Aperçu envoyé au client sur une adresse temporaire

## Étape 4 — Ajustements (semaine 4 ou 5)

- [ ] Première série de modifications
- [ ] Deuxième série de modifications
- [ ] Rappeler par écrit que les suivantes sont facturées, sans en faire un sujet

## Étape 5 — Mise en ligne (semaine 5 ou 6)

Cahier de recette — à parcourir **avant** d'annoncer la mise en ligne :

- [ ] Le site s'affiche correctement sur un vrai téléphone, pas seulement en
      simulation
- [ ] Le formulaire arrive bien dans la boîte mail du client — test réel de bout
      en bout, plus test d'un champ vide et d'une adresse invalide
- [ ] Le numéro déclenche l'appel au clic
- [ ] Toutes les pages répondent, aucun lien mort
- [ ] Le site est lisible en 3G simulée
- [ ] Lighthouse ≥ 95 sur mobile, les quatre catégories
- [ ] `sitemap.xml` accessible, `robots.txt` correct
- [ ] Certificat HTTPS actif, redirection depuis la version non sécurisée
- [ ] Fiche Google Business à jour, cohérente avec le site : même nom, même
      adresse, même téléphone
- [ ] Site déclaré dans la Search Console, sitemap soumis

## Étape 6 — Passation

- [ ] Guide d'une page remis : comment ajouter une photo, comment répondre à un
      avis, qui appeler en cas de problème
- [ ] Point de 30 minutes, en direct
- [ ] Accès transmis au client : domaine, hébergement, fiche Google
- [ ] Facture de solde envoyée
- [ ] **Accord écrit pour utiliser le chantier comme référence**
- [ ] Demander une recommandation vers deux confrères — c'est le moment où la
      satisfaction est la plus haute

---

## Après livraison

**À 30 jours** — relever la position sur les recherches visées et le nombre de
demandes reçues. Envoyer les chiffres, même s'ils sont faibles : c'est ce qui
distingue un prestataire d'un vendeur de site.

**À 90 jours** — deuxième relevé. C'est le moment où une offre de suivi mensuel
devient crédible, parce qu'on a de quoi montrer ce qu'elle sert. Pas avant.

## Ce qu'il faut mesurer sur les deux premiers chantiers

Noter le temps réel passé par étape. Deux décisions en dépendent :

1. **Le prix de l'offre suivante.** Si un chantier prend 40 heures à 1 900 €, le
   taux horaire est de 47 € — à comparer honnêtement avec la charge de travail
   d'une soirée après une journée d'alternance.
2. **Le contenu de l'offre mensuelle.** Elle ne doit lister que des livrables
   déjà tenus en pratique, mois après mois. Tant que ce rythme n'a pas été
   mesuré, l'annoncer serait promettre un engagement dont on ignore le coût.
