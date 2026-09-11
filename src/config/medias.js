/**
 * Médias du site, sous licence commerciale, importés depuis src/assets.
 *
 * Ces fichiers proviennent du template de référence, pour lequel le
 * propriétaire a acquis une licence commerciale complète. Tout est centralisé
 * ici pour qu'un remplacement soit un seul fichier à éditer, sans chasse aux
 * chemins dans les composants.
 *
 * ---- Pourquoi src/assets et plus public/medias ----
 *
 * Servis depuis public/, les médias sortaient tels quels : 6 Mo de vidéo et
 * deux PNG de 1,8 Mo, sans compression, sans version réduite pour le
 * téléphone, et sans en-tête de cache (leurs noms ne changeant jamais, le
 * serveur ne pouvait pas les déclarer immuables). Mesuré sur l'accueil en 4G
 * lente : 22,6 s avant l'affichage du plus grand élément.
 *
 * Importés, ils passent par le build :
 *
 *   — les images deviennent des ImageMetadata, que le composant Visuel
 *     décline en AVIF et WebP à plusieurs largeurs, avec leurs dimensions ;
 *   — tous reçoivent un nom haché dans /_astro/, que le serveur sert déjà en
 *     `immutable` pendant un an : un fichier modifié change de nom, donc
 *     d'adresse, et aucun cache ne peut en garder une ancienne version.
 *
 * ---- La vidéo ----
 *
 * Réencodée le 11 septembre 2026 depuis l'original 1920 × 1080 (6,07 Mo) :
 * 1280 × 720, H.264, CRF 26, sans piste son, avec l'index en tête de fichier
 * (`-movflags +faststart`) pour que la lecture démarre sans attendre la fin du
 * téléchargement. 588 Ko, pour une qualité que l'œil ne distingue pas sur ce
 * ciel peint. Commande, depuis l'original :
 *
 *   ffmpeg -i original.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow \
 *          -crf 26 -profile:v high -pix_fmt yuv420p -movflags +faststart \
 *          -an hero.mp4
 *
 * `heroAffiche` est la première image de cette vidéo : elle s'affiche seule
 * sur téléphone, en mouvement réduit et avant que la vidéo ne démarre, et la
 * vidéo prend sa place sans saut puisqu'elle commence sur la même image.
 *
 * ---- Le ciel, les nuages et les colombes : la direction artistique ----
 *
 * Le nuage de transition, la colombe et le ciel de la citation avaient été
 * retirés le 11 septembre 2026 pour leur poids et leur contraste. Ils sont
 * revenus le même jour : c'est la direction artistique du site, voulue par
 * le propriétaire. Ce qui posait problème est corrigé, pas l'image :
 *
 *   — le nuage (PNG de 1,8 Mo, élément LCP de l'accueil) sort en AVIF et WebP
 *     à la largeur de l'écran, chargé en différé ;
 *   — la colombe (210 Ko pour 256 px affichés) sort en 192 à 512 px ;
 *   — le ciel de la citation reçoit un voile qui met le texte au niveau AA.
 *
 * Les réglages de position (Showcase.astro, QuoteBanner.astro) sont calculés
 * sur le profil d'opacité du nuage, mesuré par bandes de 5 % de sa hauteur :
 *
 *    0–35 %   seul le quart gauche est plein (le reste : du vide)
 *   35–50 %   la moitié droite se remplit peu à peu
 *   50–70 %   plein sur toute la largeur        ← là où poser une couture
 *   70–86 %   s'effiloche, surtout au centre
 *   86–100 %  plus que le ruban rouge, à gauche
 *
 * Changer d'image, c'est refaire cette mesure : lire le canal alpha avec
 * sharp (`.ensureAlpha().raw()`) et compter, par bande, la part de pixels dont
 * l'alpha dépasse 200.
 */
import heroVideo from '../assets/medias/hero.mp4';
import heroAffiche from '../assets/medias/hero-affiche.webp';
import voileBas from '../assets/medias/voile-bas.png';
import fondShowcase from '../assets/medias/fond-showcase.webp';
import nuageTransition from '../assets/medias/nuage-transition.png';
import colombe from '../assets/medias/colombe.png';
import fondCitation from '../assets/medias/fond-citation.webp';

export const MEDIAS = {
  /** Une URL (chaîne) : la vidéo n'est pas une image, elle ne passe pas par Visuel. */
  heroVideo,
  /** Les autres sont des ImageMetadata, à passer à Visuel. */
  heroAffiche,
  voileBas,
  fondShowcase,
  nuageTransition,
  colombe,
  fondCitation,
  /**
   * La photo de la section « Qui suis-je ». VIDE tant qu'il n'y a pas de vraie
   * photo : la section s'affiche alors sans image, jamais avec une silhouette
   * ou un visage de banque d'images. Pour l'ajouter, déposer le fichier dans
   * src/assets/medias/ puis :
   *
   *   import photoFondateur from '../assets/medias/elio-pallois.jpg';
   *   …
   *   photoFondateur,
   */
  photoFondateur: undefined,
};

/**
 * Hôtes tiers à autoriser dans la CSP.
 *
 * Les quatre listes sont vides : les fontes Cormorant et Archivo sont
 * auto-hébergées, et les médias ci-dessus le sont aussi. `img-src`,
 * `media-src`, `style-src` et `font-src` sont donc tous à leur forme stricte,
 * `'self'` seul (plus `data:` pour les images). Les listes restent déclarées
 * pour que la structure ne change pas le jour où il faudrait rouvrir l'une
 * d'elles.
 */
export const HOTES_MEDIAS = {
  images: [],
  video: [],
  fontes: [],
  styles: [],
};
