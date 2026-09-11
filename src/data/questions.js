import { offre, offreMensuelle } from './offres.js';

/**
 * Les questions de l'accueil, dans un seul fichier, pour deux lecteurs : la
 * section Q&R (QandA.astro) et les données structurées `FAQPage` du JSON-LD
 * (schema.js). Écrites deux fois, elles finiraient par dire deux choses.
 *
 * ---- Les règles de rédaction ----
 *
 * Réponses courtes, deux ou trois phrases, et sans aucun tiret : ni cadratin,
 * ni trait d'union, à la demande du propriétaire (11 septembre 2026). Un mot
 * composé se contourne en reformulant, jamais en lui retirant son trait
 * d'union. La question sur le bouche-à-oreille garde le sien : c'est une
 * question, et c'est l'orthographe du mot.
 *
 * Chaque réponse ne dit que ce qui est écrit ailleurs et décidé : offres.js
 * pour les montants et le délai, docs/devis-modele.md pour l'acompte, les deux
 * séries de modifications et la propriété des fichiers. Une question qu'on ne
 * sait pas encore trancher (le logo, l'assurance) n'a rien à faire ici tant
 * qu'elle ne l'est pas.
 *
 * ---- Ce qui a changé le 11 septembre 2026 ----
 *
 * « Combien de temps » répondait « Je travaille en parallèle d'une alternance,
 * le soir et en fin de semaine » : vrai, mais lu au moment exact où l'on
 * hésite, et sans rapport avec la question. La disponibilité est dite, sans
 * détour, dans la section « Qui suis-je », où elle a sa place.
 *
 * Six objections qui restaient sans réponse sont ajoutées : le paiement, un
 * résultat qui ne plaît pas, les modifications après la mise en ligne, la
 * crainte que le prestataire disparaisse, le nombre de demandes à attendre (sans
 * aucun chiffre promis) et le site fait soi-même.
 */
export const questions = [
  {
    q: 'Pourquoi une fourchette de prix et pas un tarif fixe ?',
    r: 'Parce que le travail dépend de ce que vous avez déjà, vos textes et vos photos. Le devis, lui, est ferme. Une fois signé, le prix ne bouge plus.',
  },
  {
    q: 'Combien de temps avant la mise en ligne ?',
    r: `${offre.delai.replace(/^1 à 2/, 'Une à deux')} après l'acompte et la réception de vos photos. Le délai est écrit dans le devis.`,
  },
  {
    q: 'Comment se passe le paiement ?',
    r: '30 % à la signature du devis, le solde à la mise en ligne, par virement.',
  },
  {
    q: 'Et si le résultat ne me plaît pas ?',
    r: 'Vous validez les textes avant que je dessine quoi que ce soit. Après la maquette, deux séries de modifications sont comprises : c’est le moment de tout dire.',
  },
  {
    q: "Je n'ai pas de belles photos de mes chantiers",
    r: 'Envoyez quand même ce que vous avez. Je fais le tri et je vous dis franchement si ça suffit. Sinon, je viens photographier deux ou trois chantiers, en supplément.',
  },
  {
    q: 'Vous pouvez reprendre mon ancien site ?',
    r: "Je le refais sur une base propre, c'est plus rapide. Mais on garde votre nom de domaine, pour que votre adresse ne change pas, et vos textes ou photos s'il y en a de bons. On vérifie dès le premier échange que ce domaine est bien à votre nom.",
  },
  {
    q: 'Je pourrai modifier le site tout seul ?',
    r: 'Pour changer une photo ou un texte, vous me l’envoyez et je m’en occupe : c’est compris dans le suivi, et facturé à part sans lui. Les fichiers du site sont à vous, n’importe quel développeur peut les reprendre.',
  },
  {
    q: 'Vous garantissez la première place sur Google ?',
    r: "Non, et fuyez ceux qui la garantissent. Personne ne contrôle Google. Ce que je garantis, c'est un site rapide, lisible sur téléphone, écrit avec les mots que vos clients tapent vraiment.",
  },
  {
    q: 'Combien de demandes vais-je recevoir ?',
    r: 'Je ne peux pas vous le promettre : ça dépend de votre métier, de votre secteur et de vos avis. Un mois après la mise en ligne, je vous envoie les premiers chiffres, les vrais.',
  },
  {
    q: 'Je travaille déjà au bouche-à-oreille, pourquoi un site ?',
    r: "La recommandation reste ce qui marche le mieux, et un site ne la remplace pas. Mais avant d'appeler, on tape votre nom sur son téléphone. Si on ne trouve rien, on appelle aussi le suivant.",
  },
  {
    q: 'Pourquoi pas un site Wix, que je ferais moi-même ?',
    r: "Vous pouvez. Mais les textes, les photos et les réglages Google, c'est vous qui les faites, le soir après le chantier. Ici, on écrit les textes ensemble, je m'occupe du reste, et le site est à vous.",
  },
  // Seulement si le suivi est proposé : sans lui, la réponse citerait un prix
  // qui n'existe nulle part sur la page.
  offreMensuelle.actif && {
    q: 'Et après la mise en ligne, il se passe quoi ?',
    r: `La première année, l'hébergement, le nom de domaine et le certificat sont compris dans le prix. Ensuite, soit vous reprenez l'hébergement à votre nom, pour ${offreMensuelle.alternative}, soit je continue, dès ${offreMensuelle.formules[0].prix}. Rien ne se signe aujourd'hui.`,
  },
  {
    q: 'Et si vous arrêtez un jour ?',
    r: 'Le nom de domaine est à votre nom dès le départ, et les fichiers du site vous appartiennent. En cas de fin de collaboration, rien n’est retenu : n’importe quel développeur peut prendre la suite.',
  },
].filter(Boolean);
