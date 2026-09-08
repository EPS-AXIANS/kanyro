---
# ─────────────────────────────────────────────────────────────────────────────
# ⚠ BROUILLON, ET IL DOIT LE RESTER POUR L'INSTANT.
#
# La page /realisations dit, dans son état vide : « ni fausses références, ni
# MAQUETTES PRÉSENTÉES COMME DES CHANTIERS, je préfère la laisser vide jusqu'au
# premier client livré. » Ce site-là est une maquette : complète, mais pas en
# ligne. Publier cette fiche aujourd'hui contredirait la phrase à deux clics.
#
# Ce qu'il faut avant de passer `brouillon` à false :
#
#   1. Le site en ligne, et `enLigne:` renseigné avec son adresse.
#   2. `date:` remplacée par la date de MISE EN LIGNE — la page affiche
#      « mis en ligne en <mois> », et la date ci-dessous est celle de la maquette.
#   3. L'accord écrit de Frédérique Deranty pour publier son nom et son chantier.
#   4. `FONCTIONS.realisations` passé à true dans src/config/site.js, sans quoi
#      toute la section reste éteinte.
#
# `resultats:` reste vide tant qu'il n'y a rien de MESURÉ. Ce qui vaudra la peine
# d'être compté, une fois le site en ligne depuis quelques mois : les demandes
# arrivées par le formulaire (elles sont en base, donc comptables), et le temps
# passé à faire un devis avant et après. Pas d'estimation présentée comme un
# résultat.
#
# ⚠ Un mot sur le positionnement : le site vend « des sites pour les artisans du
# bâtiment ». Une relieuse est une artisane, mais pas du bâtiment. C'est la seule
# référence réelle, et elle montre plus de travail que n'importe quel chantier de
# couvreur — mais elle décale le discours d'accueil. À trancher avant publication.
# ─────────────────────────────────────────────────────────────────────────────
titre: "Un site refait, et la facturation de l'atelier avec"
client: 'Atelier de reliure Frédérique Deranty'
metier: 'relieur et restaurateur de livres anciens'
commune: 'Chuignolles'
date: 2026-09-08
resume: >-
  Un atelier installé depuis 1998, un site Wix qui montrait le travail sans
  jamais aider à le vendre. Le site a été refait, et le suivi des devis et des
  factures est passé du papier à un espace de travail qui tient les règles
  comptables à la place de l'artisane.
resultats: []
brouillon: true
---

## Le point de départ

Frédérique Deranty relie et restaure des livres depuis 1998, à Chuignolles. Son
métier se voit : des registres cousus main, des dorures au fer, des livres
anciens remontés, des enluminures peintes à la gouache. Cent quarante-quatre
photographies de ce travail existaient déjà, sur un site construit avec Wix.

Le problème n'était pas qu'il était laid. Il était lourd — sa seule page
d'accueil pesait 386 Ko de HTML, avant la moindre image — et surtout il
s'arrêtait à la vitrine. Une demande arrivait par courriel, le devis se
fabriquait à la main, la facture aussi. Le travail d'atelier finissait par se
faire le soir, après le travail d'atelier.

## Ce qui a été fait

**Le contenu a été repris, pas refait.** Les textes et les 144 photographies ont
été récupérés un par un, remis en page, et réoptimisés : chaque image existe
maintenant en WebP et en plusieurs largeurs, découpées au moment de la
fabrication du site. C'est du travail ingrat et c'est la partie qui garantit
qu'on ne perd rien en changeant d'outil.

**Le site est redevenu du fichier.** Les pages sont pré-calculées : il n'y a plus
de constructeur à charger avant de lire. La carte du contact vient
d'OpenStreetMap, servie sans compte ni clé — donc rien n'est déposé chez le
visiteur, donc aucun bandeau de consentement à afficher. Le site marche sans elle
si les tuiles ne viennent pas : l'adresse reste écrite en toutes lettres.

**Et l'atelier a reçu un back-office.** C'est la moitié du chantier, et celle qui
ne se voit pas depuis la rue. Une demande arrive par le formulaire et se range
dans une base ; un bouton en fait une fiche client et ouvre un devis déjà nommé ;
le devis accepté se facture d'un clic, ses lignes recopiées.

Cette partie-là n'est pas qu'un formulaire de plus. Une facture est une pièce
comptable, et trois règles sont tenues par le code plutôt que par la vigilance
d'un vendredi soir : une facture émise ne se modifie plus, elle ne se supprime
pas — on l'annule par un avoir —, et son numéro est attribué à l'émission et non
à la création, pour que la suite reste continue comme l'exige l'article 242
nonies A de l'annexe II du Code général des impôts. Un brouillon abandonné ne
creuse donc aucun trou dans la numérotation, et un trou dans une numérotation est
exactement ce qu'un contrôle cherche.

## Où on en est

Le site est terminé et fonctionne. Il n'est pas encore en ligne : il manque le
numéro SIRET, quelques tarifs de cours à faire relire, et le plan de bascule du
référencement — un site indexé depuis des années ne se remplace pas sans
redirections, et ça demande un accès à la console de recherche.

Aucun chiffre de résultat n'est affiché ici, et c'est volontaire : le site n'a pas
encore servi un seul visiteur. Ce qui sera compté le moment venu, ce sont les
demandes arrivées par le formulaire — elles sont enregistrées en base, donc
vérifiables — et le temps qu'un devis prend à sortir.
