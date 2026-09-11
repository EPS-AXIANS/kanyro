---
# ─────────────────────────────────────────────────────────────────────────────
# PUBLIÉE, ET LE SITE N'EST PAS ENCORE EN LIGNE. C'est assumé, à une condition
# qui est tenue ici : la page LE DIT, dès le résumé et dès la première ligne du
# corps. Une maquette présentée comme une maquette n'est pas une fausse
# référence ; une maquette présentée comme un chantier livré, si.
#
# `enLigne` reste donc absent tant qu'il n'y a pas d'adresse — c'est lui qui fait
# écrire « maquette livrée en <mois> » plutôt que « mis en ligne en <mois> » sous
# le titre, et qui retire le lien « voir le site ». Le renseigner le jour de la
# bascule suffit à basculer les deux.
#
# `date:` est celle de la livraison de la maquette. À remplacer par celle de la
# mise en ligne le même jour.
#
# `maquette:` sert le site lui-même depuis un sous-chemin de kanyro.tech. Il est
# construit avec `base: '/demo/reliure-deranty'` et déposé dans
# /var/www/kanyro/demo/. Ce sont les pages PUBLIQUES seulement : le formulaire de
# rendez-vous et l'espace atelier tournent sur un Worker Cloudflare qui n'est pas
# là, donc envoyer le formulaire tombe en 404.
#
# ⚠ Les douze pages de la démo portent `noindex, nofollow`, posé après coup sur
# la sortie construite. Sans ça, Google indexerait le futur site de l'atelier
# sous le domaine de l'agence, et les deux se feraient concurrence le jour de la
# vraie mise en ligne. Et surtout PAS un `Disallow` dans robots.txt : il
# empêcherait le robot de lire le `noindex` qu'on vient de poser.
#
# La démo se refait en rejouant le build du projet reliure avec un `base`, puis
# en réécrivant les chemins absolus écrits à la main — Astro ne préfixe que ce
# qu'il génère, pas les `href` du balisage.
#
# ⚠ RESTE À FAIRE, ET CE N'EST PAS DU CODE : l'accord de Frédérique Deranty pour
# publier son nom, son métier et sa commune sur le site de l'agence. C'est de la
# famille, donc ça se demande vite — mais ça se demande.
#
# `resultats:` reste vide tant qu'il n'y a rien de MESURÉ. Ce qui vaudra d'être
# compté, une fois le site en ligne depuis quelques mois : les demandes arrivées
# par le formulaire — elles sont en base, donc comptables — et le temps qu'un
# devis met à sortir. Pas d'estimation présentée comme un résultat.
#
# ⚠ Un mot sur le positionnement : le site vend « des sites pour les artisans du
# bâtiment ». Une relieuse est une artisane, mais pas du bâtiment. C'est la seule
# référence réelle, et elle montre plus de travail que n'importe quel chantier de
# couvreur — mais elle décale le discours d'accueil.
# ─────────────────────────────────────────────────────────────────────────────
#
# `captures:` sont des captures d'écran RÉELLES de la maquette servie sous
# /demo/reliure-deranty/, prises le 11 septembre 2026 (1 440 × 900 et
# 390 × 844). Elles montrent ce que le lien « voir la maquette » montre déjà.
# Si l'accord de publication n'est pas donné, retirer ce bloc ET le lien
# `maquette:`, les deux ensemble.
# ─────────────────────────────────────────────────────────────────────────────
titre: 'Un site refait, et un espace pour les devis et les factures'
client: 'Atelier de reliure Frédérique Deranty'
metier: 'relieur et restaurateur de livres anciens'
commune: 'Chuignolles'
date: 2026-09-08
maquette: 'https://kanyro.tech/demo/reliure-deranty/'
resume: >-
  Un atelier installé depuis 1998, un site Wix qui montrait le travail sans
  jamais aider à le vendre. Tout est refait, et le suivi des devis et des
  factures est passé du papier à un espace qui tient les règles comptables à la
  place de l'artisane. Maquette livrée, mise en ligne à venir.
description: >-
  Atelier de reliure installé depuis 1998 : le site Wix refait, et un espace
  qui gère devis et factures. Maquette livrée, mise en ligne à venir.
captures:
  - src: '../../assets/realisations/deranty-accueil-ordinateur.webp'
    alt: "Page d'accueil de la maquette du site de l'atelier de reliure Frédérique Deranty, vue sur un ordinateur"
    appareil: 'ordinateur'
    legende: "L'accueil, sur un ordinateur. Capture de la maquette livrée."
  - src: '../../assets/realisations/deranty-accueil-telephone.webp'
    alt: "La même page d'accueil de la maquette, vue sur un téléphone"
    appareil: 'telephone'
    legende: 'Le même accueil, sur un téléphone.'
resultats: []
brouillon: false
---

> **Ce chantier n'est pas encore en ligne.** Le site est terminé et fonctionne ;
> il attend le numéro SIRET de l'atelier, quelques tarifs à faire relire, et le
> plan de redirections qui évitera de perdre dix ans de référencement. Cette
> fiche décrit donc du travail livré, pas un site que vous pouvez visiter.
> Aucun chiffre de résultat n'y figure, pour la même raison.

## Pourquoi un atelier de reliure ?

C'est mon premier site livré, et il n'est pas du bâtiment. Je préfère vous le
montrer tel qu'il est plutôt que d'inventer un chantier. Le métier change, le
problème reste le même : un artisan dont le travail se voit en photo, et un site
qui doit transformer une visite en demande.

## Le point de départ

Frédérique Deranty relie et restaure des livres depuis 1998, à Chuignolles. Son
métier se voit : des registres cousus main, des dorures au fer, des livres
anciens remontés, des enluminures peintes à la gouache. Cent quarante-quatre
photographies de ce travail existaient déjà, sur un site construit avec Wix.

Le problème n'était pas qu'il était laid. Il était lourd (sa seule page
d'accueil pesait 386 Ko de HTML, avant la moindre image), et surtout il
s'arrêtait à la vitrine. Une demande arrivait par courriel, le devis se
fabriquait à la main, la facture aussi. La paperasse finissait par se faire le
soir, après la journée à l'atelier.

## Ce qui a été fait

**Le contenu a été repris, pas refait.** Les textes et les 144 photographies ont
été récupérés un par un, remis en page, et réoptimisés : chaque image existe
maintenant en WebP et en plusieurs largeurs, découpées au moment de la
fabrication du site. C'est du travail ingrat et c'est la partie qui garantit
qu'on ne perd rien en changeant d'outil.

**Le site est redevenu du fichier.** Les pages sont pré-calculées : il n'y a plus
de constructeur à charger avant de lire. La carte du contact vient
d'OpenStreetMap, servie sans compte ni clé : rien n'est donc déposé chez le
visiteur, et il n'y a aucun bandeau de consentement à afficher. Le site marche sans elle
si les tuiles ne viennent pas : l'adresse reste écrite en toutes lettres.

**Et l'atelier a reçu un back-office.** C'est la moitié du chantier, et celle qui
ne se voit pas depuis la rue. Une demande arrive par le formulaire et se range
dans une base ; un bouton en fait une fiche client et ouvre un devis déjà nommé ;
le devis accepté se facture d'un clic, ses lignes recopiées.

Cette partie-là n'est pas qu'un formulaire de plus. Une facture est une pièce
comptable, et trois règles sont tenues par le code plutôt que par la vigilance
d'un vendredi soir : une facture émise ne se modifie plus, elle ne se supprime
pas (on l'annule par un avoir), et son numéro est attribué à l'émission et non
à la création, pour que la suite reste continue comme l'exige l'article 242
nonies A de l'annexe II du Code général des impôts. Un brouillon abandonné ne
creuse donc aucun trou dans la numérotation, et un trou dans une numérotation est
exactement ce qu'un contrôle cherche.

## Où on en est

La maquette est complète et tourne. Ce qui manque tient à des informations qui
ne s'inventent pas : le numéro SIRET, mention obligatoire sans laquelle aucune
facture ne peut être émise ; quelques tarifs de cours dont l'appariement a été
reconstitué depuis l'ancienne mise en page et qui demandent une relecture ; et le
plan de bascule du référencement, parce qu'un site indexé depuis des années ne se
remplace pas sans redirections.

Aucun chiffre de résultat n'est affiché ici, et c'est volontaire : le site n'a pas
encore servi un seul visiteur. Ce qui sera compté le moment venu, ce sont les
demandes arrivées par le formulaire, enregistrées en base et donc vérifiables,
et le temps qu'un devis prend à sortir. En attendant, il n'y a rien
à afficher, et une estimation présentée comme un résultat ne vaut rien.
