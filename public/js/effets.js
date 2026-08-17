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

// ---- Échec d'envoi du formulaire ----
// contact.php redirige vers /contact?erreur=1 quand le message n'a pas pu
// partir. Sans ce bloc, l'échec serait invisible et le visiteur croirait sa
// demande envoyée. Le bandeau existe déjà dans le HTML, masqué par `hidden`.
if (new URLSearchParams(window.location.search).has('erreur')) {
  const bandeau = document.getElementById('erreur-envoi');
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
