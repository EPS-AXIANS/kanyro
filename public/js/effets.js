/**
 * Révélations, frise du déroulement, parallaxe, barre de navigation, et confort
 * du formulaire de devis.
 *
 * ── Pourquoi ce code vit dans un fichier séparé et pas dans une balise
 *    <script> du layout ──
 *
 * Astro inline les petits scripts directement dans le HTML. Un script inline est
 * bloqué par `script-src 'self'`, qui n'autorise que les fichiers servis depuis
 * le domaine. Résultat en production : le script ne s'exécute jamais, les
 * éléments `.reveal` restent à `opacity: 0`, et la page s'affiche vide — alors
 * que tout fonctionne en développement, où la CSP n'est pas émise.
 *
 * Le layout le charge par `src`, ce qui donne un vrai fichier .js conforme.
 *
 * ⚠ EN REVANCHE, ÉCRIRE UN STYLE DEPUIS JAVASCRIPT EST AUTORISÉ. `style-src`
 * régit les balises <style> et les attributs `style` PRÉSENTS DANS LE BALISAGE,
 * pas les écritures via le CSSOM. `element.style.setProperty(…)` passe donc la
 * CSP — c'est ce dont vivent la parallaxe, les cascades et la frise ci-dessous.
 *
 * ── Pourquoi tout est rangé dans des fonctions ──
 *
 * `<ClientRouter />` remplace le contenu de la page sans recharger le document.
 * Un module ne s'exécute qu'une fois : tout ce qui aurait été résolu au premier
 * chargement — `querySelector` du formulaire, observateurs, écouteurs —
 * pointerait après une navigation sur des nœuds qui ne sont plus dans le
 * document. Le symptôme serait silencieux et coûteux : la restauration de
 * saisie et les bandeaux d'erreur de /contact cesseraient de fonctionner sans
 * que rien ne le signale.
 *
 * D'où la forme : chaque bloc est une fonction d'initialisation qui rend de quoi
 * se démonter, et `initialiser()` est rejouée à chaque navigation.
 *
 * ── Dégradation ──
 *
 * Tout ce que fait ce module est décoratif, à une exception près (la barre de
 * navigation, voir plus bas). Le CSS ne masque `.reveal` que sous
 * `@media (scripting: enabled)` : si le script échoue, ne se charge pas, ou si
 * le visiteur a coupé JavaScript, le contenu reste intégralement lisible.
 */

const MOUVEMENT_DOUX = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Ce que la cascade sait animer. Une classe de plus se déclare ici, et sa règle
 * `.classe.revealed` dans global.css.
 *
 * `.reveal-scale` en faisait partie — le zoom léger qui portait la citation de
 * la section « Vos clients vous cherchent déjà ». Elle est passée au rideau, et
 * plus rien dans le balisage ne s'en servait : la classe, ses images-clés et ses
 * exceptions ont été retirées plutôt que gardées « au cas où ».
 */
const SELECTEUR_ANIME = '.reveal, .rideau';

/** Décalage par défaut entre deux enfants d'un groupe, en millisecondes. */
const PAS_CASCADE = 90;

/**
 * Hauteur, en fraction de la fenêtre, de la ligne où une étape s'allume quand la
 * frise est VERTICALE. 0 est le haut de l'écran, 1 le bas. À 0,6 le nœud
 * s'allume un peu sous le milieu, juste au moment où le regard l'atteint.
 */
const ACTIVATION_FRISE = 0.6;

/**
 * Les deux lignes entre lesquelles la frise HORIZONTALE se remplit : la barre
 * démarre quand le haut de la frise atteint 85 % de la hauteur d'écran, et
 * finit quand son bas remonte à 35 %.
 */
const DEPART_FRISE_H = 0.85;
const ARRIVEE_FRISE_H = 0.35;

/* ------------------------------------------------------------------------- */
/* Défilement : une seule boucle pour tout le monde                           */
/* ------------------------------------------------------------------------- */

/*
 * Les écouteurs sont posés une fois pour la vie du document ; ce sont les LISTES
 * qu'on vide et qu'on remplit à chaque navigation. Poser puis retirer des
 * écouteurs de défilement à chaque changement de page reviendrait au même en
 * plus fragile : il suffit d'en oublier un pour garder en vie une référence vers
 * une page démontée.
 */
let auDefilement = [];
let auRedimensionnement = [];

let planifie = false;

const relancer = () => {
  if (planifie) return;
  planifie = true;
  requestAnimationFrame(() => {
    planifie = false;
    for (const f of auDefilement) f();
  });
};

window.addEventListener('scroll', relancer, { passive: true });
window.addEventListener(
  'resize',
  () => {
    for (const f of auRedimensionnement) f();
    relancer();
  },
  { passive: true }
);

/* ------------------------------------------------------------------------- */
/* Formulaire de devis : échecs et saisie conservée                           */
/* ------------------------------------------------------------------------- */

/*
 * Le site est statique : le serveur ne peut pas réafficher le formulaire
 * pré-rempli après une erreur. contact.php se contente donc de rediriger vers
 * /contact?erreur=<motif>, et c'est ici qu'on restaure ce qui avait été tapé.
 *
 * La saisie transite par sessionStorage plutôt que par l'URL : une adresse email
 * et un message en clair dans une query string finissent dans les journaux du
 * serveur, dans l'historique du navigateur et dans l'en-tête Referer envoyé aux
 * hôtes tiers. sessionStorage reste dans l'onglet et disparaît à sa fermeture.
 */
const CHAMPS_DEVIS = [
  'nom',
  'entreprise',
  'email',
  'telephone',
  'metier',
  'disponibilite',
  'message',
];
const CLE_DEVIS = 'kanyro:devis';

// Certains navigateurs refusent sessionStorage (navigation privée verrouillée,
// stockage désactivé). Le formulaire doit continuer à fonctionner sans.
const stockage = (() => {
  try {
    const s = window.sessionStorage;
    s.setItem('kanyro:test', '1');
    s.removeItem('kanyro:test');
    return s;
  } catch {
    return null;
  }
})();

function initFormulaireDevis() {
  // La demande est passée : plus aucune raison de garder la saisie sous la main.
  if (stockage && window.location.pathname.replace(/\/$/, '') === '/merci') {
    stockage.removeItem(CLE_DEVIS);
  }

  const formulaire = document.querySelector('form[name="devis"]');
  if (!formulaire) return null;

  const memoriser = () => {
    const valeurs = {};
    for (const champ of CHAMPS_DEVIS) {
      const el = formulaire.elements[champ];
      if (el) valeurs[champ] = el.value;
    }
    try {
      stockage.setItem(CLE_DEVIS, JSON.stringify(valeurs));
    } catch {
      /* Quota plein : on renonce à la restauration, pas à l'envoi. */
    }
  };

  if (stockage) formulaire.addEventListener('submit', memoriser);

  const motifErreur = new URLSearchParams(window.location.search).get('erreur');

  if (motifErreur) {
    // `erreur=1` est l'ancienne forme, encore possible si une page en cache la
    // porte. Elle retombe sur le message d'échec d'envoi, qui était le seul.
    const bandeau =
      document.getElementById(`erreur-${motifErreur}`) ??
      document.getElementById('erreur-envoi');

    if (stockage) {
      try {
        const valeurs = JSON.parse(stockage.getItem(CLE_DEVIS) ?? '{}');
        for (const [champ, valeur] of Object.entries(valeurs)) {
          const el = formulaire.elements[champ];
          if (el && typeof valeur === 'string') el.value = valeur;
        }
      } catch {
        /* Entrée illisible : on laisse le formulaire vide plutôt que de planter. */
      }
      stockage.removeItem(CLE_DEVIS);
    }

    if (bandeau) {
      bandeau.hidden = false;
      bandeau.scrollIntoView({
        block: 'center',
        behavior: MOUVEMENT_DOUX.matches ? 'auto' : 'smooth',
      });
    }
  }

  return () => {
    if (stockage) formulaire.removeEventListener('submit', memoriser);
  };
}

/* ------------------------------------------------------------------------- */
/* Révélations                                                                */
/* ------------------------------------------------------------------------- */

/*
 * Deux régimes, et la distinction n'est pas cosmétique.
 *
 * ── Éléments isolés ──
 * Chacun est observé pour lui-même et se révèle sans délai quand il entre.
 * C'est le bon régime pour tout ce qui est plus haut qu'un écran : les dix
 * questions de la Q&R, par exemple. Une cascade y serait un défaut — c'est ce
 * qu'elle était : la dixième question portait un délai de 1 200 ms, décompté à
 * partir de SON entrée à elle, donc le visiteur voyait un trou pendant plus
 * d'une seconde avant que le texte n'arrive.
 *
 * ── Groupes `[data-cascade]` ──
 * C'est le conteneur qu'on observe, et ses enfants directs sont décalés les uns
 * après les autres à partir du moment où LE GROUPE entre. Une cascade n'a de
 * sens que là : un ensemble qui tient à l'écran d'un seul coup, comme les quatre
 * blocs de l'offre ou les six étapes de la frise.
 *
 * Le décalage est écrit dans `--retard`, qui hérite. Le poser sur un `<li>`
 * décale donc du même temps tout ce qu'il contient, sans avoir à le répéter sur
 * chaque enfant — c'est ce qui fait que le nœud d'une étape et son texte
 * arrivent ensemble.
 *
 * ⚠ Le pas s'applique aux ENFANTS DIRECTS du groupe, animés ou non. Un enfant
 * décoratif intercalé consommerait donc un cran de la cascade. C'est un choix :
 * la règle reste lisible et prévisible à la lecture du balisage.
 */
function initRevelations() {
  const doux = MOUVEMENT_DOUX.matches;
  const reveler = (el) => el.classList.add('revealed');

  const groupes = [...document.querySelectorAll('[data-cascade]')];
  const isoles = [...document.querySelectorAll(SELECTEUR_ANIME)].filter(
    (el) => !el.closest('[data-cascade]')
  );

  const revelerGroupe = (groupe) => {
    const pas = Number(groupe.dataset.cascade) || PAS_CASCADE;
    [...groupe.children].forEach((enfant, i) => {
      enfant.style.setProperty('--retard', `${i * pas}ms`);
    });
    groupe.querySelectorAll(SELECTEUR_ANIME).forEach(reveler);
  };

  // Mouvement réduit, ou navigateur sans IntersectionObserver : on montre tout
  // plutôt que rien, et sans décalage — un décalage sans animation n'est plus
  // qu'une attente.
  if (doux || !('IntersectionObserver' in window)) {
    isoles.forEach(reveler);
    for (const groupe of groupes) {
      groupe.querySelectorAll(SELECTEUR_ANIME).forEach(reveler);
    }
    return null;
  }

  const obsIsoles = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        reveler(entree.target);
        obsIsoles.unobserve(entree.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  /*
   * Seuil à 0 et marge basse pour les groupes, là où les éléments isolés se
   * contentent de 15 %. Un groupe peut être plus haut que la fenêtre — la grille
   * de la Q&R fait deux écrans — et le ratio visible d'un élément plus grand que
   * la fenêtre ne peut jamais atteindre certains seuils. La marge basse de 12 %
   * déclenche quand le haut du groupe passe aux 88 % de l'écran, ce qui ne
   * dépend pas de sa hauteur.
   */
  const obsGroupes = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        revelerGroupe(entree.target);
        obsGroupes.unobserve(entree.target);
      }
    },
    { threshold: 0, rootMargin: '0px 0px -12% 0px' }
  );

  isoles.forEach((el) => obsIsoles.observe(el));
  groupes.forEach((el) => obsGroupes.observe(el));

  return () => {
    obsIsoles.disconnect();
    obsGroupes.disconnect();
  };
}

/* ------------------------------------------------------------------------- */
/* La frise du déroulement                                                    */
/* ------------------------------------------------------------------------- */

/*
 * La barre de progression est liée au défilement, pas jouée une fois. La
 * différence n'est pas d'ambition : une frise qui se dessine à l'entrée dit
 * « il y a une animation ici », une frise qui suit le défilement dit « vous en
 * êtes là dans le processus ». C'est la seule des deux qui ajoute du sens.
 *
 * ── L'horloge n'est pas la même dans les deux orientations ──
 *
 * Sous 1 024 px la frise est verticale : défiler avance le long de son axe, la
 * progression est directe. Au-dessus elle est HORIZONTALE, et défiler ne
 * déplace rien le long de sa longueur. Il faut donc une autre horloge, et c'est
 * le passage de la frise devant la fenêtre qui sert : elle se remplit de gauche
 * à droite pendant qu'elle traverse l'écran.
 *
 * `course` est ce qui réconcilie les deux. C'est la distance de défilement sur
 * laquelle la barre se remplit entièrement. Une frise verticale est plus haute
 * qu'un demi-écran, donc c'est sa propre hauteur qui gagne et la progression
 * suit le regard. Une frise horizontale ne fait que 400 px de haut : le plancher
 * à 60 % de la hauteur de fenêtre lui donne une course confortable, sinon elle
 * se remplirait d'un coup.
 *
 * ── Les fractions sont mesurées, pas déduites ──
 *
 * On pourrait croire les six nœuds régulièrement espacés — c'est vrai sur la
 * grille de six colonnes du bureau, faux en vertical où la hauteur de chaque
 * étape dépend de la longueur de son texte. Les centres sont donc relevés
 * réellement, ce qui rend le code indifférent à l'orientation ET à toute
 * étape qu'on ajouterait.
 */
function initFrise() {
  const frise = document.querySelector('[data-frise]');
  if (!frise) return null;

  const axe = frise.querySelector('[data-frise-axe]');
  const remplissage = frise.querySelector('[data-frise-remplissage]');
  const etapes = [...frise.querySelectorAll('[data-frise-etape]')];

  if (!axe || !remplissage || etapes.length < 2) return null;

  let fractions = etapes.map(() => 0);

  const mesurer = () => {
    const rAxe = axe.getBoundingClientRect();
    const horizontal = rAxe.width > rAxe.height;
    const debut = horizontal ? rAxe.left : rAxe.top;
    const longueur = horizontal ? rAxe.width : rAxe.height;

    fractions = etapes.map((etape) => {
      const noeud = etape.querySelector('[data-frise-noeud]') ?? etape;
      const r = noeud.getBoundingClientRect();
      const centre = horizontal ? r.left + r.width / 2 : r.top + r.height / 2;
      return longueur > 0 ? (centre - debut) / longueur : 0;
    });
  };

  const appliquer = (p) => {
    remplissage.style.setProperty('--progression', String(p));
    etapes.forEach((etape, i) => {
      // `p > 0` garde la première étape éteinte tant qu'on n'a pas commencé à
      // descendre : son centre est à peu près à l'origine de l'axe, donc sans
      // cette condition elle serait allumée d'avance.
      etape.toggleAttribute('data-atteint', p > 0 && p + 0.0001 >= fractions[i]);
    });
  };

  // Mouvement réduit : l'état final, tout de suite. La frise garde son sens de
  // lecture, elle ne le raconte simplement plus.
  if (MOUVEMENT_DOUX.matches) {
    mesurer();
    appliquer(1);
    return null;
  }

  const placer = () => {
    const rAxe = axe.getBoundingClientRect();
    const vh = window.innerHeight;
    let brut;

    if (rAxe.width > rAxe.height) {
      /*
       * Frise horizontale. Le trait fait un pixel de haut : défiler ne déplace
       * rien le long de sa longueur, il faut donc une autre horloge, et c'est la
       * traversée de la frise entière devant la fenêtre qui sert. La barre part
       * quand le haut de la frise arrive au bas de l'écran et finit quand son bas
       * en atteint le tiers supérieur.
       */
      const r = frise.getBoundingClientRect();
      const course = vh * (DEPART_FRISE_H - ARRIVEE_FRISE_H) + r.height;
      brut = (vh * DEPART_FRISE_H - r.top) / course;
    } else {
      /*
       * Frise verticale. L'axe est sa propre règle : la progression vaut
       * exactement la position de la ligne d'activation le long du trait. Un nœud
       * s'allume donc à l'instant précis où il franchit cette ligne, sans réglage
       * à faire — c'est la seule formule des deux qui soit exacte.
       */
      brut = (vh * ACTIVATION_FRISE - rAxe.top) / rAxe.height;
    }

    appliquer(Math.min(Math.max(brut, 0), 1));
  };

  mesurer();
  placer();

  /*
   * Une remesure après le chargement des fontes. Cormorant et Archivo arrivent
   * après le premier rendu : tant qu'elles ne sont pas là, les titres d'étape
   * sont composés dans la fonte de repli, les hauteurs diffèrent, et les centres
   * relevés au premier passage ne valent plus rien en vertical.
   */
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      // La promesse peut se résoudre après une navigation : sans ce garde, on
      // mesurerait la frise d'une page démontée, dont toutes les boîtes valent
      // zéro. Sans conséquence visible, mais autant ne pas le faire.
      if (!frise.isConnected) return;
      mesurer();
      placer();
    });
  }

  const remesurer = () => {
    mesurer();
    placer();
  };

  auDefilement.push(placer);
  auRedimensionnement.push(remesurer);

  return null;
}

/* ------------------------------------------------------------------------- */
/* Barre de navigation                                                        */
/* ------------------------------------------------------------------------- */

/*
 * ⚠ CE BLOC N'EST PAS DÉCORATIF, contrairement à tout le reste du fichier.
 *
 * La pastille est en verre à 1 % d'opacité : superbe sur la vidéo sombre du
 * premier écran, illisible partout ailleurs — le texte des sections passe au
 * travers sur le fond brique, et les libellés blancs se noient dans le ciel
 * clair de la citation.
 *
 * Le CSS part donc de l'état DENSE, celui qui se lit partout, et ce script ne
 * fait qu'ÉCLAIRCIR la barre là où le fond est sûr. Une panne de script laisse
 * une barre un peu moins jolie sur le hero ; l'inverse aurait laissé une
 * navigation illisible sur les trois quarts du site.
 *
 * Le seuil vaut aussi pour les pages internes, dont le haut est noir : la barre
 * y reste transparente le temps du premier écran, ce qui est sans danger.
 */
function initBarre() {
  const barre = document.querySelector('[data-barre]');
  if (!barre) return null;

  const placer = () => {
    barre.classList.toggle(
      'barre-claire',
      window.scrollY < window.innerHeight * 0.6
    );
  };

  placer();
  auDefilement.push(placer);

  return () => barre.classList.remove('barre-claire');
}

/* ------------------------------------------------------------------------- */
/* Parallaxe                                                                  */
/* ------------------------------------------------------------------------- */

/*
 * `data-parallaxe` = amplitude ; `data-parallaxe-depart` décale la position
 * initiale en pourcentage de la hauteur de l'élément.
 */
function initParallaxe() {
  if (MOUVEMENT_DOUX.matches) return null;

  const calques = [...document.querySelectorAll('[data-parallaxe]')];
  if (!calques.length) return null;

  const placer = () => {
    const vh = window.innerHeight;

    for (const calque of calques) {
      const r = calque.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;

      const amplitude = Number(calque.dataset.parallaxe) || 0;
      const depart = Number(calque.dataset.parallaxeDepart) || 0;
      const progres = Math.min(Math.max(1 - r.bottom / (vh + r.height), 0), 1);

      calque.style.transform = depart
        ? `translateY(${depart - progres * amplitude}%)`
        : `translateY(${-(progres * amplitude)}px)`;
    }
  };

  placer();
  auDefilement.push(placer);

  return null;
}

/* ------------------------------------------------------------------------- */
/* Vidéo du hero : reprise au premier geste                                   */
/* ------------------------------------------------------------------------- */

/*
 * La vidéo de fond est `autoplay muted loop playsinline`, ce qui suffit dans le
 * cas général. Certains contextes mobiles la bloquent malgré tout — mode
 * économie d'énergie sur iOS, économiseur de données sur Android. Le navigateur
 * affiche alors son propre bouton de lecture, centré sur la vidéo donc sous le
 * bloc de texte et le bouton du hero : impossible à taper. La vidéo reste figée
 * sur sa première image.
 *
 * Le premier geste du visiteur, n'importe où sur la page, vaut interaction
 * utilisateur : c'est le moment où `play()` est autorisé. On ne le tente qu'une
 * fois (`once`), et `touchstart` est passif pour ne pas retarder le défilement.
 * Rappeler `play()` sur une vidéo déjà en lecture est sans effet — inutile de
 * vérifier au préalable qu'elle est en pause.
 *
 * Volontairement hors du garde `MOUVEMENT_DOUX` : `prefers-reduced-motion`
 * couvre le mouvement décoratif ajouté par le site, pas cette vidéo. Le
 * propriétaire assume qu'elle joue dans tous les cas.
 */
function initVideoHero() {
  const video = document.getElementById('video-hero');
  if (!video) return null;

  const relancerLecture = () => {
    video.play().catch(() => {
      /* Refus persistant du navigateur : on n'insiste pas. */
    });
  };

  document.addEventListener('touchstart', relancerLecture, {
    once: true,
    passive: true,
  });
  document.addEventListener('click', relancerLecture, { once: true });

  return () => {
    document.removeEventListener('touchstart', relancerLecture);
    document.removeEventListener('click', relancerLecture);
  };
}

/* ------------------------------------------------------------------------- */
/* Cycle de vie                                                               */
/* ------------------------------------------------------------------------- */

let nettoyages = [];

function demonter() {
  for (const nettoyer of nettoyages) nettoyer();
  nettoyages = [];
  auDefilement = [];
  auRedimensionnement = [];
}

function initialiser() {
  // Idempotente : la rappeler sur une page déjà montée la remonte proprement.
  // C'est ce qui rend l'appel direct ci-dessous inoffensif même si Astro émet
  // aussi `astro:page-load` au premier chargement.
  demonter();

  nettoyages = [
    initFormulaireDevis(),
    initRevelations(),
    initFrise(),
    initBarre(),
    initParallaxe(),
    initVideoHero(),
  ].filter(Boolean);
}

/*
 * L'appel direct couvre le premier chargement quoi qu'il arrive. `astro:page-load`
 * est censé être émis aussi à ce moment-là, mais ce module est un script différé
 * placé en fin de <body> : rien ne garantit qu'il s'exécute avant que le routeur,
 * lui, ait déjà émis l'événement. Faire les deux ne coûte rien, `initialiser()`
 * étant idempotente ; n'en faire qu'un exposerait à une page morte selon l'ordre
 * d'exécution.
 */
initialiser();
document.addEventListener('astro:page-load', initialiser);
document.addEventListener('astro:before-swap', demonter);
