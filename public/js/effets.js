/**
 * Révélation au scroll et parallaxe.
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
 * Le layout importe ce module, ce qui force Vite à émettre un vrai fichier .js
 * chargé par `src` — conforme à la CSP.
 *
 * ── Dégradation ──
 *
 * Tout ce que fait ce module est décoratif. Le CSS ne masque `.reveal` que sous
 * `@media (scripting: enabled)` : si le script échoue, ne se charge pas, ou si
 * le visiteur a coupé JavaScript, le contenu reste intégralement lisible.
 */
const doux = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Formulaire de devis : échecs et saisie conservée ----
//
// Le site est statique : le serveur ne peut pas réafficher le formulaire
// pré-rempli après une erreur. contact.php se contente donc de rediriger vers
// /contact?erreur=<motif>, et c'est ici qu'on restaure ce qui avait été tapé.
//
// La saisie transite par sessionStorage plutôt que par l'URL : une adresse email
// et un message en clair dans une query string finissent dans les journaux du
// serveur, dans l'historique du navigateur et dans l'en-tête Referer envoyé aux
// hôtes tiers. sessionStorage reste dans l'onglet et disparaît à sa fermeture.
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

const formulaireDevis = document.querySelector('form[name="devis"]');

if (formulaireDevis && stockage) {
  formulaireDevis.addEventListener('submit', () => {
    const valeurs = {};
    for (const champ of CHAMPS_DEVIS) {
      const el = formulaireDevis.elements[champ];
      if (el) valeurs[champ] = el.value;
    }
    try {
      stockage.setItem(CLE_DEVIS, JSON.stringify(valeurs));
    } catch {
      /* Quota plein : on renonce à la restauration, pas à l'envoi. */
    }
  });
}

// La demande est passée : plus aucune raison de garder la saisie sous la main.
if (stockage && window.location.pathname.replace(/\/$/, '') === '/merci') {
  stockage.removeItem(CLE_DEVIS);
}

const motifErreur = new URLSearchParams(window.location.search).get('erreur');

if (formulaireDevis && motifErreur) {
  // `erreur=1` est l'ancienne forme, encore possible si une page en cache la
  // porte. Elle retombe sur le message d'échec d'envoi, qui était le seul.
  const bandeau =
    document.getElementById(`erreur-${motifErreur}`) ??
    document.getElementById('erreur-envoi');

  if (stockage) {
    try {
      const valeurs = JSON.parse(stockage.getItem(CLE_DEVIS) ?? '{}');
      for (const [champ, valeur] of Object.entries(valeurs)) {
        const el = formulaireDevis.elements[champ];
        if (el && typeof valeur === 'string') el.value = valeur;
      }
    } catch {
      /* Entrée illisible : on laisse le formulaire vide plutôt que de planter. */
    }
    stockage.removeItem(CLE_DEVIS);
  }

  if (bandeau) {
    bandeau.hidden = false;
    bandeau.scrollIntoView({ block: 'center', behavior: doux ? 'auto' : 'smooth' });
  }
}

// ---- Révélations ----
const cibles = document.querySelectorAll('.reveal, .reveal-scale');

if (doux) {
  cibles.forEach((el) => el.classList.add('revealed'));
} else if ('IntersectionObserver' in window) {
  const observateur = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        entree.target.classList.add('revealed');
        observateur.unobserve(entree.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  cibles.forEach((el) => observateur.observe(el));
} else {
  // Navigateur sans IntersectionObserver : on montre tout plutôt que rien.
  cibles.forEach((el) => el.classList.add('revealed'));
}

// ---- Parallaxe ----
// `data-parallaxe` = amplitude ; `data-parallaxe-depart` décale la position
// initiale en pourcentage de la hauteur de l'élément.
const calques = document.querySelectorAll('[data-parallaxe]');

if (calques.length && !doux) {
  let planifie = false;

  const placer = () => {
    planifie = false;
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

  const auScroll = () => {
    if (planifie) return;
    planifie = true;
    requestAnimationFrame(placer);
  };

  placer();
  window.addEventListener('scroll', auScroll, { passive: true });
  window.addEventListener('resize', auScroll, { passive: true });
}
