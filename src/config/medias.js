/**
 * Médias du site, sous licence commerciale et hébergés en local.
 *
 * Ces fichiers proviennent du template de référence, pour lequel le
 * propriétaire a acquis une licence commerciale complète : rien n'interdit plus
 * de les diffuser. Ils ont été rapatriés depuis le stockage du vendeur
 * (CloudFront, export Figma, proxy d'images) vers `public/medias/`, ce qui règle
 * l'autre problème : le site ne dépend plus d'un hébergement tiers qui pourrait
 * disparaître sans préavis, et n'ouvre plus aucun hôte externe dans la CSP.
 *
 * Les deux fonds `.webp` sont ceux que servait le proxy, déjà redimensionnés en
 * 1280 px de large et compressés. Si l'un d'eux manque de finesse sur un grand
 * écran, l'original en pleine résolution reste récupérable dans l'historique de
 * ce fichier, à l'adresse CloudFront que masquait le paramètre `url=`.
 *
 * Tout est centralisé ici pour qu'un remplacement soit un seul fichier à
 * éditer, sans chasse aux chemins dans les composants.
 */
export const MEDIAS = {
  heroVideo: '/medias/hero-video.mp4',

  nuageTransition: '/medias/nuage-transition.png',

  colombe: '/medias/colombe.png',

  voileBas: '/medias/voile-bas.png',

  fondShowcase: '/medias/fond-showcase.webp',

  fondCitation: '/medias/fond-citation.webp',
};

/**
 * Hôtes tiers à autoriser dans la CSP.
 *
 * Les quatre listes sont vides : les fontes Cormorant et Archivo sont
 * auto-hébergées, et les médias ci-dessus le sont désormais aussi. `img-src`,
 * `media-src`, `style-src` et `font-src` sont donc tous revenus à leur forme
 * stricte, `'self'` seul (plus `data:` pour les images). Les listes restent
 * déclarées pour que la structure ne change pas le jour où il faudrait rouvrir
 * l'une d'elles — et pour que `public/.htaccess`, qui doit rester le miroir de
 * ce fichier, garde les mêmes directives dans le même ordre.
 */
export const HOTES_MEDIAS = {
  images: [],
  video: [],
  fontes: [],
  styles: [],
};
