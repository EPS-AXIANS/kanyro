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
 * Hauteur, en fraction de la fenêtre, de la ligne où une étape s'allume. 0 est
 * le haut de l'écran, 1 le bas. À 0,6 le nœud s'allume un peu sous le milieu,
 * juste au moment où le regard l'atteint.
 */
const ACTIVATION_FRISE = 0.6;

/**
 * Profondeur de la bosse de l'arc de raccord, en pourcentage de sa LARGEUR — et
 * non de sa hauteur. Exprimée ainsi, la courbe garde la même allure sur un
 * téléphone et sur un grand écran ; 0 donnerait une arête droite.
 */
const COURBE_ARC = 10;

/** Côté du repère carré dans lequel le chemin de l'arc est tracé. */
const REPERE_ARC = 100;

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
/* Formulaire de devis : validation vivante                                   */
/* ------------------------------------------------------------------------- */

/*
 * Chaque champ dit où il en est pendant la saisie : une coche quand il est bon,
 * une pastille et une phrase quand il ne l'est pas. L'affichage est repris de la
 * ressource Osmo « Live Form Validation (Advanced) » — voir la section « Le
 * formulaire » de global.css, qui détaille ce qui en vient et ce qui a changé.
 *
 * ---- Ce que ce bloc ne fait PAS ----
 *
 * Il n'envoie rien. Le bouton reste un `<button type="submit">` et le formulaire
 * un POST natif vers contact.php : script absent, bloqué par la CSP ou en
 * erreur, la demande part quand même et `required` rend la main aux bulles du
 * navigateur. La ressource fait l'inverse — faux bouton, envoi programmatique —
 * et perd le formulaire avec le script.
 *
 * Il ne remplace pas non plus contact.php, qui revalide les mêmes règles : tout
 * ce qui se vérifie dans un navigateur se contourne depuis un autre.
 *
 * ---- Le seul réglage délicat ----
 *
 * QUAND un champ a le droit de dire qu'il ne va pas. Trop tôt, et « a@ » est
 * déclaré fautif au troisième caractère d'une adresse qu'on est en train
 * d'écrire ; trop tard, et on l'apprend une fois la demande partie. Le compromis
 * est celui de la ressource : un champ ne peut afficher d'erreur qu'une fois
 * QUITTÉ une première fois, ou au moment de l'envoi. La réussite, elle,
 * s'affiche sans attendre — c'est un encouragement, pas un reproche.
 */

const MOTIF_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
 * Un numéro français en compte dix ; on en exige huit. Les indicatifs, les
 * formats étrangers et les numéros courts existent, et refuser un téléphone
 * PARCE QU'IL EST INHABITUEL coûte une demande de devis. Le champ est facultatif
 * de toute façon : ce seuil n'attrape que la faute de frappe évidente.
 */
const CHIFFRES_TELEPHONE = 8;

function initValidationDevis() {
  const formulaire = document.querySelector('form[name="devis"]');
  if (!formulaire) return null;

  const champs = [...formulaire.querySelectorAll('[data-validate]')]
    .map((groupe) => ({
      groupe,
      saisie: groupe.querySelector('input, select, textarea'),
    }))
    .filter((champ) => champ.saisie);

  if (champs.length === 0) return null;

  /*
   * `novalidate` posé ICI, et surtout pas dans le balisage. Écrit dans la page,
   * il désarmerait le navigateur pour tout le monde — y compris pour celui dont
   * le script n'a jamais chargé, dont le formulaire partirait alors incomplet
   * vers contact.php, qui ne peut que le refuser. Posé depuis JavaScript, il ne
   * s'applique qu'aux visiteurs pour lesquels nous prenons vraiment le relais.
   */
  formulaire.noValidate = true;

  /*
   * Une quinzaine d'écouteurs, coupés d'un seul geste au démontage. La liste
   * de `removeEventListener` équivalente serait à tenir à jour à la main : c'est
   * une fuite qui attend son tour.
   */
  const abandon = new AbortController();
  const { signal } = abandon;

  /* Les groupes autorisés à afficher une erreur — voir l'en-tête de section. */
  const eveilles = new WeakSet();

  const estValide = ({ groupe, saisie }) => {
    const valeur = saisie.value.trim();

    if (valeur === '') return groupe.hasAttribute('data-optionnel');
    if (saisie.type === 'email') return MOTIF_EMAIL.test(valeur);
    if (saisie.type === 'tel') {
      return (valeur.match(/\d/g) ?? []).length >= CHIFFRES_TELEPHONE;
    }

    /*
     * Pour tout le reste, une valeur non vide suffit — la longueur maximale est
     * tenue par `maxlength` dans le balisage, qui empêche la faute au lieu de la
     * signaler.
     */
    return true;
  };

  const afficher = (champ) => {
    const { groupe, saisie } = champ;
    const bon = estValide(champ);
    const fautif = !bon && eveilles.has(groupe);

    /* Un champ facultatif laissé vide n'a rien réussi : pas de coche. */
    groupe.classList.toggle('is--succes', bon && saisie.value.trim() !== '');
    groupe.classList.toggle('is--erreur', fautif);

    if (fautif) saisie.setAttribute('aria-invalid', 'true');
    else saisie.removeAttribute('aria-invalid');
  };

  for (const champ of champs) {
    const { groupe, saisie } = champ;

    saisie.addEventListener(
      'blur',
      () => {
        eveilles.add(groupe);
        afficher(champ);
      },
      { signal }
    );

    /*
     * `change` pour une liste déroulante, `input` pour tout le reste : on ne
     * tape pas dans un <select>, et son `input` n'y ajoute rien qu'un doublon.
     */
    saisie.addEventListener(
      saisie.tagName === 'SELECT' ? 'change' : 'input',
      () => afficher(champ),
      { signal }
    );
  }

  formulaire.addEventListener(
    'submit',
    (evenement) => {
      let premierFautif = null;

      for (const champ of champs) {
        eveilles.add(champ.groupe);
        afficher(champ);
        if (!premierFautif && !estValide(champ)) premierFautif = champ;
      }

      /* Rien à redire : l'envoi suit son cours, natif, vers contact.php. */
      if (!premierFautif) return;

      evenement.preventDefault();

      /*
       * `preventScroll` parce que le saut sec du focus arriverait AVANT le
       * défilement doux ci-dessous, qui n'aurait alors plus rien à parcourir.
       */
      premierFautif.saisie.focus({ preventScroll: true });
      premierFautif.groupe.scrollIntoView({
        block: 'center',
        behavior: MOUVEMENT_DOUX.matches ? 'auto' : 'smooth',
      });
    },
    { signal }
  );

  /*
   * Retour de contact.php avec `?erreur=saisie` : le bandeau annonce « vérifiez
   * les champs signalés ci-dessous ». Encore faut-il qu'ils le soient.
   *
   * ⚠ CETTE PASSE DÉPEND DE L'ORDRE DANS `initialiser()`. La saisie vient d'être
   * restaurée par `initFormulaireDevis`, qui est appelée juste avant ; dans
   * l'autre sens, elle ne trouverait que des champs vides et les signalerait
   * tous, y compris ceux que le visiteur avait correctement remplis.
   */
  if (new URLSearchParams(window.location.search).get('erreur') === 'saisie') {
    for (const champ of champs) {
      eveilles.add(champ.groupe);
      afficher(champ);
    }
  }

  return () => abandon.abort();
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
 * ── L'axe est sa propre règle ──
 *
 * La frise est verticale, donc défiler avance le long de son axe : la
 * progression vaut exactement la position de la ligne d'activation le long du
 * trait, et un nœud s'allume à l'instant précis où il la franchit. Rien à
 * régler, rien à approcher.
 *
 * Ça n'a l'air de rien, mais c'est ce que la version horizontale interdisait.
 * Un trait d'un pixel de haut ne se déplace pas le long de sa longueur quand on
 * défile : il fallait lui inventer une horloge à partir de la traversée de la
 * section, avec deux constantes de réglage et une formule qu'aucune mesure ne
 * validait vraiment. Elles ont disparu avec la mise en page.
 *
 * ── Ce qui est mesuré, et pourquoi ──
 *
 * La hauteur d'une étape dépend de la longueur de son texte : les six nœuds ne
 * sont jamais régulièrement espacés, et aucune valeur écrite à la main ne peut
 * viser le centre du dernier. On relève donc les centres réellement, ce qui sert
 * à deux choses d'un coup :
 *
 *   — poser `top` et `height` sur l'axe, pour qu'il s'arrête au centre du
 *     premier et du dernier nœud plutôt que de déborder dans le vide ;
 *   — savoir à quelle fraction de la course chaque nœud doit s'allumer.
 *
 * Et le code reste juste si on ajoute une étape.
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
    // Centres des nœuds, relatifs au haut de la liste — c'est le repère de
    // l'axe, qui y est positionné en absolu.
    const hautListe = frise.getBoundingClientRect().top;
    const centres = etapes.map((etape) => {
      const noeud = etape.querySelector('[data-frise-noeud]') ?? etape;
      const r = noeud.getBoundingClientRect();
      return r.top + r.height / 2 - hautListe;
    });

    const premier = centres[0];
    const portee = centres[centres.length - 1] - premier;

    axe.style.top = `${premier}px`;
    axe.style.height = `${portee}px`;

    fractions = centres.map((c) => (portee > 0 ? (c - premier) / portee : 0));
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

    // Axe de hauteur nulle : la mesure n'a pas encore eu lieu, ou la liste est
    // masquée. Diviser donnerait l'infini, donc une frise pleine d'un coup.
    if (rAxe.height <= 0) return appliquer(0);

    const brut =
      (window.innerHeight * ACTIVATION_FRISE - rAxe.top) / rAxe.height;

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
/* Le libellé des boutons                                                     */
/* ------------------------------------------------------------------------- */

/*
 * Découpe le libellé en lettres et le double, pour l'échange de texte au survol.
 *
 * Toute l'animation est dans global.css. Cette fonction ne fait que préparer le
 * terrain : deux copies superposées du libellé, une lettre par span, et deux
 * variables par lettre.
 *
 * ---- Pourquoi c'est écrit à la main ----
 *
 * La ressource d'origine confie ce découpage à GSAP et à son greffon SplitText.
 * Elle n'en utilise que la capacité à envelopper chaque caractère et à y poser
 * deux variables — soit ces quelques lignes, contre une quarantaine de kilos de
 * dépendance. Et le CDN qui les sert est de toute façon refusé par
 * `script-src 'self'` : il aurait fallu les installer et les empaqueter.
 *
 * ---- Les deux variables ----
 *
 *   --index  distance de la lettre au centre du mot, 0 au milieu.
 *   --signe  la même distance, positive à gauche du centre, négative à droite.
 *
 * Elles sont écrites par le CSSOM, que `style-src` ne régit pas — un attribut
 * `style` dans le balisage, lui, serait refusé.
 *
 * ---- Le nom accessible ----
 *
 * ⚠ Un libellé haché en spans se fait épeler lettre par lettre par certains
 * lecteurs d'écran. Le texte entier est donc relevé AVANT le découpage et posé
 * en `aria-label`, et l'enveloppe est masquée par `aria-hidden`. Le bouton garde
 * ainsi exactement le nom qu'il avait.
 */
function initBoutonsAnimes() {
  /*
   * Mêmes conditions que la règle de survol dans global.css. Sur un appareil
   * tactile l'effet ne peut pas se jouer : découper le texte n'y apporterait
   * rien et ferait perdre au libellé son crénage et ses ligatures.
   */
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return null;

  /*
   * ⚠ `[data-bouton-anime]` SEUL, et plus `.bouton-primaire`.
   *
   * L'échange de lettres appartient au « Demander un devis » : c'est le geste
   * de l'unique chemin de conversion, et il perd tout son poids s'il se joue
   * aussi sur « Retour à l'accueil » ou « Revoir l'offre ». Le commentaire de
   * 404.astro le disait déjà — « l'effet suit le libellé » — mais le sélecteur,
   * lui, suivait la classe, et attrapait les onze boutons primaires du site.
   *
   * Désormais l'effet se demande, il ne s'hérite pas. Les autres boutons
   * gardent l'aimantation du curseur, qui elle reste automatique.
   */
  const boutons = document.querySelectorAll('[data-bouton-anime]');

  for (const bouton of boutons) {
    /*
     * `initialiser()` est rejouée sur un DOM déjà préparé au premier chargement :
     * l'appel direct et `astro:page-load` se suivent de près. Sans ce garde, le
     * second passage relit `textContent` — qui vaut alors les DEUX copies mises
     * bout à bout — et redécoupe un libellé doublé. Mesuré avant correction :
     * 68 lettres au lieu de 34, et un bouton deux fois trop large.
     *
     * ⚠ `hasAttribute` et non la valeur : un attribut de données vide est une
     * chaîne vide, donc fausse. C'est exactement l'erreur qui a produit le
     * doublement.
     */
    if (bouton.hasAttribute('data-bouton-decoupe')) continue;

    const libelle = bouton.textContent.trim();
    if (!libelle) continue;

    if (!bouton.hasAttribute('aria-label')) {
      bouton.setAttribute('aria-label', libelle);
    }

    const lettres = [...libelle];
    const centre = (lettres.length - 1) / 2;

    const enveloppe = document.createElement('span');
    enveloppe.className = 'bouton-texte';
    enveloppe.setAttribute('aria-hidden', 'true');
    enveloppe.style.setProperty('--index-max', String(Math.floor(centre)));

    for (const variante of ['defaut', 'survol']) {
      const copie = document.createElement('span');
      copie.className = `bouton-texte__${variante}`;

      lettres.forEach((lettre, i) => {
        const distance = Math.floor(Math.abs(i - centre));
        const span = document.createElement('span');
        span.className = 'bouton-lettre';
        span.textContent = lettre;
        span.style.setProperty('--index', String(distance));
        span.style.setProperty(
          '--signe',
          String(i < centre ? distance : i > centre ? -distance : 0)
        );
        copie.append(span);
      });

      enveloppe.append(copie);
    }

    bouton.replaceChildren(enveloppe);
    bouton.dataset.boutonDecoupe = '';
  }

  return null;
}

/* ------------------------------------------------------------------------- */
/* Survol directionnel                                                        */
/* ------------------------------------------------------------------------- */

/**
 * Où poser la tuile avant qu'elle n'entre, selon le bord franchi par le
 * curseur. Elle sort ensuite par le bord où la main s'en va, ce qui est tout
 * l'intérêt : un fond au survol qui apparaît toujours du même côté contredit le
 * geste une fois sur deux.
 */
const DEPARTS_TUILE = {
  haut: 'translateY(-100%)',
  bas: 'translateY(100%)',
  gauche: 'translateX(-100%)',
  droite: 'translateX(100%)',
};

/*
 * ⚠ DEUX GARDES AVANT DE S'ATTACHER, ET LE SECOND N'EST PAS DANS LA RESSOURCE
 * D'ORIGINE.
 *
 * `(hover: hover)` écarte les appareils sans survol réel. Sur un téléphone,
 * `mouseenter` est bien émis à la première touche — mais `mouseleave` ne vient
 * qu'au tap suivant, ailleurs. La tuile resterait donc allumée sous le doigt,
 * puis sous la question d'à côté. Sur une cible qui lit ce site au téléphone,
 * ça ne pouvait pas rester.
 */
function initSurvolDirectionnel() {
  if (MOUVEMENT_DOUX.matches) return null;
  if (!window.matchMedia('(hover: hover)').matches) return null;

  const conteneurs = [...document.querySelectorAll('[data-survol-directionnel]')];
  if (!conteneurs.length) return null;

  const detacher = [];

  /** Le bord le plus proche du point où le curseur a franchi la boîte. */
  const bord = (evenement, item, axe) => {
    const { left, top, width, height } = item.getBoundingClientRect();
    const x = evenement.clientX - left;
    const y = evenement.clientY - top;

    if (axe === 'y') return y < height / 2 ? 'haut' : 'bas';
    if (axe === 'x') return x < width / 2 ? 'gauche' : 'droite';

    const distances = { haut: y, droite: width - x, bas: height - y, gauche: x };
    return Object.entries(distances).reduce((a, b) => (a[1] < b[1] ? a : b))[0];
  };

  for (const conteneur of conteneurs) {
    const axe = conteneur.dataset.survolDirectionnel || 'tout';

    for (const item of conteneur.querySelectorAll('[data-survol-item]')) {
      const tuile = item.querySelector('[data-survol-tuile]');
      if (!tuile) continue;

      const entrer = (evenement) => {
        const cote = bord(evenement, item, axe);

        /*
         * ⚠ `void tuile.offsetHeight` N'EST PAS UNE LIGNE MORTE.
         *
         * Lire une propriété de disposition force le navigateur à recalculer
         * sur-le-champ. Sans elle, il regrouperait les deux écritures de
         * `transform` dans le même cycle, ne verrait que la dernière, et la
         * tuile apparaîtrait à sa place finale sans jamais glisser.
         *
         * La transition est coupée le temps de poser le départ, pour que ce
         * repositionnement ne s'anime pas lui aussi.
         */
        tuile.style.transition = 'none';
        tuile.style.transform = DEPARTS_TUILE[cote];
        void tuile.offsetHeight;
        tuile.style.transition = '';
        tuile.style.transform = 'translate(0, 0)';

        item.dataset.survolEtat = `entree-${cote}`;
      };

      const sortir = (evenement) => {
        const cote = bord(evenement, item, axe);
        item.dataset.survolEtat = `sortie-${cote}`;
        tuile.style.transform = DEPARTS_TUILE[cote];
      };

      item.addEventListener('mouseenter', entrer);
      item.addEventListener('mouseleave', sortir);

      detacher.push(() => {
        item.removeEventListener('mouseenter', entrer);
        item.removeEventListener('mouseleave', sortir);
      });
    }
  }

  return () => {
    for (const f of detacher) f();
  };
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
/* Le curseur magnétique                                                      */
/* ------------------------------------------------------------------------- */

/*
 * Un point suit le pointeur ; au survol d'un lien de la barre, il migre DANS le
 * lien et s'y dilate pour en devenir le fond.
 *
 * ---- Ce qui vient d'ailleurs, et ce qui a été refait ----
 *
 * Le découpage est celui de la ressource Osmo « Magnetic Cursor » : un élément
 * fixe qui suit la souris, un enfant qui change de parent au survol, une
 * animation FLIP par-dessus pour que le changement de parent se voie comme un
 * mouvement et non comme un saut.
 *
 * La ressource confie les deux à GSAP (`quickTo`) et à son greffon Flip, servis
 * par jsDelivr. Ils sont donc bloqués par `script-src 'self'`, comme l'était
 * SplitText pour le libellé des boutons : ce qui suit les remplace.
 *
 * ---- Le FLIP, en trois mesures ----
 *
 * Déplacer un nœud dans le document le fait sauter : il disparaît d'un endroit
 * et réapparaît ailleurs, à une autre taille. Le remède tient en quatre gestes —
 * mesurer AVANT, déplacer, mesurer APRÈS, puis animer depuis la différence
 * jusqu'à zéro. Le nœud est déjà à sa place définitive pendant toute
 * l'animation ; ce qu'on voit n'est qu'une transformation qui s'annule.
 *
 * C'est tout ce que fait le greffon Flip, à ceci près qu'il couvre des cas dont
 * rien ici n'a besoin : listes réordonnées, éléments absents d'un des deux
 * états, `position: absolute` recalculé.
 */

/*
 * Ce que le point sait habiter : les liens marqués, et TOUS les boutons du
 * vocabulaire partagé. Les nommer par leur classe plutôt que de poser un
 * attribut sur chacun évite qu'un bouton ajouté demain soit le seul à ne rien
 * faire — c'est le même parti que `initBoutonsAnimes` prenait pour les lettres,
 * avant que celles-ci ne deviennent l'exception plutôt que la règle.
 */
const CIBLES_CURSEUR =
  '[data-curseur-cible], .bouton-primaire, .bouton-secondaire';

/*
 * Fraction de la distance restante rattrapée à chaque cadre.
 *
 * Resserré depuis que la bille REMPLACE le curseur natif au lieu de
 * l'accompagner : ce n'est plus un ornement qui traîne derrière une flèche
 * bien visible, c'est le seul repère dont dispose la main pour viser. Un
 * amortissement trop lâche donne alors l'impression que la page répond mal.
 *
 * Assez haut pour que la bille colle au geste, assez bas pour qu'il reste une
 * traîne : c'est le seul réglage à toucher si le suivi paraît mou ou nerveux.
 */
const SUIVI_CURSEUR = 0.22;

/** En deçà, le point est arrivé et la boucle s'arrête au lieu de tourner à vide. */
const SEUIL_ARRET_CURSEUR = 0.1;

/*
 * Capture plus courte que le relâchement, et légèrement rebondie : le point est
 * happé par le lien, puis y retourne sans hâte. Les deux durées sont celles de
 * la ressource ; `back.out(1)` et `power4.out` sont ici leurs équivalents en
 * courbes de Bézier, GSAP n'étant pas là pour les fournir.
 */
const DUREE_CAPTURE = 300;
const DUREE_RELACHE = 450;
const COURBE_CAPTURE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const COURBE_RELACHE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/*
 * Dernière position connue du pointeur, gardée AU NIVEAU DU MODULE et non dans
 * la fonction d'initialisation.
 *
 * `<ClientRouter />` remplace le <body> à chaque navigation : le point est donc
 * un nouvel élément, sans position. Repartir de zéro le ferait traverser
 * l'écran depuis le coin haut-gauche après chaque changement de page — alors
 * que le pointeur, lui, n'a pas bougé. Le module, lui, n'est exécuté qu'une
 * fois : cette variable survit à la navigation.
 */
let positionPointeur = null;

function initCurseurMagnetique() {
  /*
   * Mêmes conditions que pour le libellé des boutons. Sur un écran tactile il
   * n'y a pas de pointeur à suivre ; sous mouvement réduit, un point qui
   * poursuit la souris est exactement ce que le réglage demande d'éviter.
   */
  if (MOUVEMENT_DOUX.matches) return null;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return null;

  const curseur = document.querySelector('[data-curseur]');
  const fond = curseur?.querySelector('[data-curseur-fond]');
  if (!curseur || !fond) return null;

  /*
   * À partir d'ici, la bille existe : le curseur natif peut s'effacer.
   *
   * ⚠ POSÉE ICI ET NULLE PART AILLEURS, et jamais retirée au démontage.
   *
   * Ici, parce que toutes les conditions viennent d'être vérifiées — pointeur
   * fin, mouvement non réduit, script exécuté, éléments présents. Dans le
   * balisage, la classe priverait de curseur ceux pour qui rien ne le remplace.
   *
   * Jamais retirée, parce que `demonter()` est joué à chaque navigation : la
   * flèche reviendrait le temps du changement de page, à chaque fois. Ce que la
   * classe décrit — un pointeur fin, un visiteur qui accepte le mouvement — ne
   * change pas d'une page à l'autre.
   */
  document.documentElement.classList.add('curseur-remplace');

  const abandon = new AbortController();
  const { signal } = abandon;

  let x = positionPointeur?.x ?? 0;
  let y = positionPointeur?.y ?? 0;
  let viseeX = x;
  let viseeY = y;
  let trame = 0;

  /* Le CSSOM échappe à `style-src` — voir l'en-tête du fichier. */
  const poser = () => {
    curseur.style.setProperty('--x', String(x));
    curseur.style.setProperty('--y', String(y));
  };

  /* Retour de navigation : le point reprend là où le pointeur avait été vu. */
  if (positionPointeur) {
    poser();
    curseur.classList.add('est-visible');
  }

  const avancer = () => {
    x += (viseeX - x) * SUIVI_CURSEUR;
    y += (viseeY - y) * SUIVI_CURSEUR;

    if (
      Math.abs(viseeX - x) < SEUIL_ARRET_CURSEUR &&
      Math.abs(viseeY - y) < SEUIL_ARRET_CURSEUR
    ) {
      x = viseeX;
      y = viseeY;
      poser();
      trame = 0; // La boucle s'éteint ; le prochain mouvement la rallume.
      return;
    }

    poser();
    trame = requestAnimationFrame(avancer);
  };

  window.addEventListener(
    'mousemove',
    (evenement) => {
      viseeX = evenement.clientX;
      viseeY = evenement.clientY;

      if (!positionPointeur) {
        // Tout premier mouvement de la session : le point se pose sous le
        // pointeur au lieu d'y courir depuis le coin de l'écran.
        x = viseeX;
        y = viseeY;
        poser();
        curseur.classList.add('est-visible');
      }

      positionPointeur = { x: viseeX, y: viseeY };
      if (!trame) trame = requestAnimationFrame(avancer);
    },
    { signal, passive: true }
  );

  /**
   * Déplace le fond dans `destination` sans que le saut se voie.
   *
   * ⚠ L'ORDRE DES QUATRE GESTES N'EST PAS INTERCHANGEABLE.
   *
   * La mesure d'avant se prend AVANT d'annuler l'animation en cours :
   * `getBoundingClientRect` tient compte des transformations, donc elle rend la
   * position RÉELLEMENT VUE à cet instant. C'est ce qui rend une interruption
   * fluide — repartir de la position de repos ferait sauter le fond au milieu
   * de son trajet.
   *
   * L'annulation se fait ensuite, et avant la mesure d'après : une
   * transformation encore appliquée fausserait la mesure d'arrivée, et le
   * décalage se reporterait sur l'animation entière.
   */
  const migrer = (destination, duree, courbe) => {
    const avant = fond.getBoundingClientRect();
    const opaciteAvant = getComputedStyle(fond).opacity;

    for (const animation of fond.getAnimations()) animation.cancel();

    destination.append(fond);

    const apres = fond.getBoundingClientRect();
    // Destination encore sans dimensions (barre masquée, page en cours de
    // remplacement) : le rapport d'échelle serait une division par zéro.
    if (apres.width === 0 || apres.height === 0) return;

    fond.animate(
      [
        {
          transform: `translate(${avant.left - apres.left}px, ${avant.top - apres.top}px) scale(${avant.width / apres.width}, ${avant.height / apres.height})`,
          opacity: opaciteAvant,
        },
        {
          transform: 'translate(0px, 0px) scale(1, 1)',
          opacity: getComputedStyle(fond).opacity,
        },
      ],
      { duration: duree, easing: courbe, fill: 'none' }
    );
  };

  for (const cible of document.querySelectorAll(CIBLES_CURSEUR)) {
    /*
     * Le logement est CRÉÉ ICI plutôt que posé dans le balisage.
     *
     * Une douzaine de boutons répartis sur sept fichiers auraient eu à porter
     * le même <span> vide, et le prochain bouton ajouté aurait été le premier à
     * l'oublier — sans que rien ne le signale, puisqu'un bouton sans logement
     * ne fait qu'ignorer l'effet. `initBoutonsAnimes` procède déjà ainsi pour
     * les lettres.
     *
     * `:scope >` : seulement un logement à soi. Un bouton contenu dans une
     * autre cible ne doit pas hériter du sien.
     */
    let logement = cible.querySelector(':scope > [data-curseur-logement]');

    if (!logement) {
      logement = document.createElement('span');
      logement.className = 'curseur-logement';
      logement.setAttribute('data-curseur-logement', '');
      logement.setAttribute('aria-hidden', 'true');
      cible.append(logement);
    }

    cible.addEventListener(
      'mouseenter',
      () => migrer(logement, DUREE_CAPTURE, COURBE_CAPTURE),
      { signal }
    );

    cible.addEventListener(
      'mouseleave',
      () => migrer(curseur, DUREE_RELACHE, COURBE_RELACHE),
      { signal }
    );
  }

  return () => {
    abandon.abort();
    if (trame) cancelAnimationFrame(trame);

    /*
     * ⚠ RAMENER LE FOND DANS LE POINT AVANT LE REMPLACEMENT DE LA PAGE.
     *
     * Ce démontage est joué sur `astro:before-swap`. Si le pointeur se trouve
     * alors sur un lien de la barre — le cas ORDINAIRE, puisqu'on vient de
     * cliquer dessus — le fond vit à l'intérieur de ce lien, qui part avec
     * l'ancien document. Sans cette ligne il serait détruit avec lui : plus
     * rien ne suivrait le pointeur sur toutes les pages suivantes, et la panne
     * n'apparaîtrait qu'après une navigation.
     */
    for (const animation of fond.getAnimations()) animation.cancel();
    curseur.append(fond);
  };
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
/* L'arc de raccord entre deux sections                                       */
/* ------------------------------------------------------------------------- */

/*
 * Deux aplats de couleur qui se suivent — le brique de l'offre, le noir de la
 * page — se touchent sur une droite qui traverse tout l'écran. L'arc remplace
 * cette droite par une courbe qui monte avec le défilement : le noir de la
 * section d'après vient recouvrir la fin de la section brique, en avançant par
 * le milieu.
 *
 * ---- Ce qui vient d'ailleurs, et ce qui a été refait ----
 *
 * La forme et son pilotage viennent de la ressource Osmo « Arc Scroll
 * Transition » : un chemin à quatre points dont l'arête remonte, avec un point
 * de contrôle qui s'écarte à mi-course et revient à plat aux deux bouts.
 *
 * LE MOTEUR est refait, comme pour le curseur magnétique et le libellé des
 * boutons. La ressource repose sur GSAP et son greffon ScrollTrigger servis par
 * jsDelivr — donc bloqués par `script-src 'self'`. Le suivi passe par la boucle
 * de défilement commune de ce fichier, et la course est calculée à la main.
 *
 * ---- La course, qui est le seul vrai réglage ----
 *
 * Elle commence quand le bas de la section hôte atteint le bas de la fenêtre,
 * et se termine à l'arrivée de l'élément désigné par `data-arc-fin`.
 *
 * Sa longueur décide de la VITESSE. L'arête remonte pour deux raisons à la
 * fois : elle se remplit, et sa boîte défile avec la page. Elle avance donc de
 * (1 + hauteur de la boîte / longueur de la course) fois la vitesse du
 * défilement. Sur une course d'un écran — le défaut de la ressource, dont les
 * sections font une hauteur d'écran — ça fait deux fois trop vite, et le bas de
 * la section est avalé d'un coup. Visée sur la Q&R, deux sections plus bas, la
 * course dure environ trois écrans : la courbe monte alors à peine plus vite
 * que le texte qu'elle recouvre.
 *
 * ⚠ L'arc finit de TRAVERSER L'ÉCRAN bien avant sa fin de course, et c'est
 * normal : une fois l'arête sortie par le haut, il ne reste plus un pixel de
 * brique à l'écran et le reste du remplissage se joue hors champ. Chercher à
 * faire coïncider les deux raccourcirait la course, donc accélérerait la
 * montée — c'est-à-dire exactement le défaut qu'on vient d'écarter.
 *
 * ---- Les deux sens ----
 *
 * Par défaut l'arc RECOUVRE : il est collé au bas de sa section, se remplit du
 * bas vers le haut, et sa bosse pointe vers le haut. C'est la couleur de la
 * section suivante qui monte.
 *
 * `data-arc-mode="envers"` le RETOURNE : il est collé au HAUT de sa section,
 * part plein et se vide vers le haut, et sa bosse pointe vers le bas. C'est
 * alors la couleur de la section PRÉCÉDENTE qui s'attarde sur celle-ci avant
 * de se retirer. Même mécanisme, courbure opposée — les deux modes de la
 * ressource, `cover` et `reveal`.
 *
 * ⚠ Un arc à l'envers MASQUE du contenu le temps de se retirer, là où l'autre
 * ne recouvre que ce qu'on vient de lire. Sa course doit donc rester courte :
 * laissé sur le défaut d'un écran, il a fini de dégager pile quand le haut de
 * la section atteint le haut de la fenêtre. Lui donner un `data-arc-fin`
 * lointain le ferait traîner sur le texte, ce qui n'est plus un raccord.
 */
function initArcTransition() {
  const hotes = [...document.querySelectorAll('[data-arc]')];
  if (!hotes.length) return null;

  /*
   * Mouvement réduit : aucune forme n'est construite, et le balisage reste la
   * boîte vide qu'il est. Le raccord redevient la coupure droite d'avant, ce
   * qui est un défaut d'ornement et rien d'autre.
   */
  if (MOUVEMENT_DOUX.matches) return null;

  const NS_SVG = 'http://www.w3.org/2000/svg';
  const arrondir = (v) => Math.round(v * 100) / 100;

  const arcs = hotes.map((hote) => {
    const svg = document.createElementNS(NS_SVG, 'svg');
    svg.setAttribute('viewBox', `0 0 ${REPERE_ARC} ${REPERE_ARC}`);
    // La forme s'étire à sa boîte, quelles que soient ses proportions ; c'est
    // `dessiner` qui rétablit celles de la courbe.
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const trace = document.createElementNS(NS_SVG, 'path');
    svg.append(trace);
    hote.append(svg);

    const courbe = Number.parseFloat(hote.dataset.arcCourbe);

    return {
      hote,
      svg,
      trace,
      section: hote.closest('section') ?? hote.parentElement,
      fin: hote.dataset.arcFin
        ? document.querySelector(hote.dataset.arcFin)
        : null,
      courbe: Number.isFinite(courbe) ? courbe : COURBE_ARC,
      envers: hote.dataset.arcMode === 'envers',
    };
  });

  const dessiner = (arc, p) => {
    const boite = arc.hote.getBoundingClientRect();

    /*
     * Le repère est carré, la boîte ne l'est pas, et l'étirement est libre :
     * une profondeur donnée en pourcentage de la largeur doit être ramenée dans
     * l'échelle verticale. Sans ce rapport, la bosse s'aplatirait à mesure que
     * la fenêtre s'élargit.
     */
    const profondeur =
      boite.height > 0 ? arc.courbe * (boite.width / boite.height) : 0;

    // Nulle aux deux bouts, maximale à mi-course : la section commence et finit
    // de se remplir à plat, sans que la courbe ait à se résorber d'un coup.
    const bosse = profondeur * Math.sin(p * Math.PI);

    /*
     * L'arête est à la même hauteur dans les deux sens — c'est ce qui reste de
     * part et d'autre qui change. À l'endroit, la matière pend sous l'arête et
     * s'accroche au bas du repère ; à l'envers, elle est au-dessus et s'accroche
     * au haut. D'où le seul bord à choisir, et le seul signe à retourner.
     */
    const bord = arc.envers ? 0 : REPERE_ARC;
    const arete = arrondir(REPERE_ARC - REPERE_ARC * p);

    // Le sommet d'une quadratique est à mi-chemin de son point de contrôle :
    // celui-ci s'écarte donc du DOUBLE de la profondeur voulue.
    const controle = arrondir(arc.envers ? arete + bosse * 2 : arete - bosse * 2);

    arc.trace.setAttribute(
      'd',
      `M0 ${bord} L0 ${arete} Q${REPERE_ARC / 2} ${controle} ${REPERE_ARC} ${arete} L${REPERE_ARC} ${bord} Z`
    );
  };

  const placer = () => {
    for (const arc of arcs) {
      const boite = arc.section.getBoundingClientRect();

      /*
       * Le bord d'où part la course. À l'endroit c'est le BAS de la section :
       * l'arc raccorde avec ce qui vient après, il n'a rien à faire tant que la
       * fin de la section n'est pas en vue. À l'envers c'est son HAUT, puisque
       * le raccord se joue à l'entrée.
       */
      const depart = arc.envers ? boite.top : boite.bottom;

      /*
       * `fin.top - depart` est une distance de MISE EN PAGE : les deux boîtes
       * défilent ensemble, leur écart ne dépend donc pas de l'endroit où on se
       * trouve dans la page. La relire à chaque cadre coûte une mesure de plus
       * et dispense de la réviser au redimensionnement, à l'arrivée des fontes
       * ou à l'ouverture d'une réponse de la Q&R.
       *
       * Le plancher à 1 évite la division par zéro le temps qu'une mise en page
       * incomplète se stabilise ; sans cible, on retombe sur la course d'un
       * écran de la ressource.
       */
      const portee = arc.fin
        ? Math.max(arc.fin.getBoundingClientRect().top - depart, 1)
        : window.innerHeight;

      const brut = (window.innerHeight - depart) / portee;
      dessiner(arc, Math.min(Math.max(brut, 0), 1));
    }
  };

  placer();

  auDefilement.push(placer);
  auRedimensionnement.push(placer);

  return () => {
    for (const arc of arcs) arc.svg.remove();
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
    // ⚠ `initValidationDevis` LIT les champs que `initFormulaireDevis` vient de
    // restaurer après un retour en erreur. Les intervertir ferait signaler des
    // champs encore vides — voir l'en-tête de la validation.
    initFormulaireDevis(),
    initValidationDevis(),
    initRevelations(),
    initFrise(),
    initArcTransition(),
    initBarre(),
    initSurvolDirectionnel(),
    // ⚠ `initBoutonsAnimes` REMPLACE le contenu des boutons qu'il découpe
    // (`replaceChildren`). Il doit donc passer AVANT le curseur, qui y ajoute
    // son logement — dans l'autre sens, le logement serait effacé au premier
    // chargement et l'aimantation ne marcherait que sur les autres cibles.
    initBoutonsAnimes(),
    initCurseurMagnetique(),
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
