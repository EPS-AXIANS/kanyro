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
 * Retirés le même jour, parce qu'ils ne servaient plus ou desservaient la
 * page : le nuage de transition (1,8 Mo, élément LCP de l'accueil, qui
 * remontait sous le titre et le bouton du premier écran), la colombe, et le
 * ciel pastel de la citation (le blanc y tombait à 2,7:1 de contraste).
 */
import heroVideo from '../assets/medias/hero.mp4';
import heroAffiche from '../assets/medias/hero-affiche.webp';
import voileBas from '../assets/medias/voile-bas.png';
import fondShowcase from '../assets/medias/fond-showcase.webp';

export const MEDIAS = {
  /** Une URL (chaîne) : la vidéo n'est pas une image, elle ne passe pas par Visuel. */
  heroVideo,
  /** Les autres sont des ImageMetadata, à passer à Visuel. */
  heroAffiche,
  voileBas,
  fondShowcase,
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
