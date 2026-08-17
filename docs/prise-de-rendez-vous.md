# Prise de rendez-vous — configuration

Outil retenu : **Cal.com**, offre gratuite. Open source, hébergement européen,
et récupérable plus tard si tu veux l'auto-héberger. Calendly fait la même chose
mais son offre gratuite est limitée à un seul type de rendez-vous et les données
partent aux États-Unis.

**Intégration : lien sortant, pas d'iframe.** Un widget embarqué imposerait
d'ouvrir la CSP, déposerait des cookies tiers — ce qui rendrait fausse
l'affirmation des mentions légales — et doublerait le poids de la page. Une fois
ton compte créé, colle l'URL publique dans `rendezVous.url` de
`src/config/site.js` : le bouton apparaît tout seul sur la page contact.

---

## Le problème à résoudre

Ton rythme d'alternance est irrégulier : **16 h en centre de formation, 18 h à
22 h en entreprise**, selon les semaines.

Une disponibilité récurrente du type « tous les soirs 18 h-20 h » est donc un
piège : elle te fera prendre des rendez-vous les semaines où tu finis à 22 h, et
tu annuleras. Annuler un rendez-vous à un artisan qui s'est libéré coûte
beaucoup plus cher que de ne pas lui avoir proposé le créneau.

**Le seul créneau vrai toutes les semaines, c'est le samedi matin.** Tout le
reste s'ouvre au cas par cas.

## Configuration

### 1. Le type de rendez-vous — un seul

| Réglage | Valeur | Pourquoi |
|---|---|---|
| Nom | Premier échange | |
| Durée | **20 minutes** | Le site promet « on en parle vingt minutes ». Tenir le format annoncé. |
| Lieu | Appel téléphonique | Pas de visio : un artisan répond au téléphone, il n'installe pas Meet. |
| Champ requis | Numéro de téléphone | C'est toi qui appelles. |
| Champ requis | Métier + commune | Te permet d'arriver préparé. |

### 2. La disponibilité récurrente — samedi uniquement

```
Lundi à vendredi   fermé
Samedi             9 h 00 – 12 h 00
Dimanche           fermé
```

Oui, ça paraît maigre. C'est volontaire : mieux vaut trois créneaux tenus que
dix créneaux dont la moitié saute.

### 3. Les soirs — en ouverture manuelle

Cal.com appelle ça les **date overrides** (« exceptions de date »). Chaque fois
que tu connais ton planning — typiquement le dimanche soir pour la semaine —
ouvre les soirées où tu sais que tu finis tôt :

```
Semaine en centre de formation  →  ouvrir mardi et jeudi, 18 h 30 – 20 h 00
Semaine en entreprise           →  n'ouvrir aucun soir, sauf certitude
```

Cinq minutes le dimanche soir. C'est la seule discipline que demande ce système.

### 4. Les garde-fous

| Réglage | Valeur | Pourquoi |
|---|---|---|
| Délai de prévenance minimum | **24 heures** | Empêche qu'on te réserve pour ce soir alors que tu viens d'apprendre que tu finis tard. |
| Tampon après rendez-vous | 15 minutes | Un échange de 20 minutes avec un artisan en dure 35. |
| Maximum par jour | 3 | Au-delà, un samedi matin est mangé et tu ne produis plus. |
| Fenêtre de réservation | 30 jours | Au-delà, ton planning d'alternance n'est pas connu. |

### 5. La vraie solution, à moyen terme

Connecte ton **Google Calendar** à Cal.com, et saisis-y ton planning
d'alternance une fois pour toutes. Cal.com bloque alors automatiquement les
créneaux occupés, et tu peux te permettre une disponibilité plus large sans
risquer de conflit.

C'est vingt minutes de saisie au début de chaque cycle, et ça supprime la
discipline hebdomadaire du point 3. Tant que ce n'est pas fait, reste sur
samedi matin + ouvertures manuelles.

---

## Ce que ça ne remplace pas

Ce calendrier ne sera **pas** ton canal principal. Un couvreur sur un chantier ne
réserve pas un créneau en ligne : il appelle, ou il remplit le formulaire et
attend d'être rappelé.

Sa vraie fonction est de **protéger ton agenda** : il rend impossible le « je
vous rappelle mardi à 10 h » sans que tu aies à expliquer ta situation à chaque
prospect. Le formulaire de contact reste l'entrée principale, avec son champ
« quand vous joindre » pour ceux qui ne cliqueront jamais sur le calendrier.

## Après le rendez-vous

Enchaîner sur `questionnaire-client.md`. Les vingt minutes servent à qualifier,
pas à vendre : si ça accroche, on cale un vrai rendez-vous de cadrage sur le
chantier, où l'on remplit le questionnaire et où l'on prend les premières photos.
