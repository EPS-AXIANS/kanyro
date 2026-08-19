/**
 * ⚠ MÉDIAS PROVISOIRES — À REMPLACER AVANT TOUTE MISE EN LIGNE.
 *
 * Ces URL proviennent du template de référence et pointent vers le stockage
 * d'un tiers (CloudFront, export Figma, proxy d'images). Deux problèmes, tous
 * deux réels :
 *
 *   1. Elles peuvent disparaître sans préavis. Le jour où le propriétaire vide
 *      son bucket, le site de l'agence perd sa vidéo d'accueil.
 *   2. Rien n'établit le droit de les diffuser sur un site commercial.
 *
 * Tout est centralisé ici pour que le remplacement soit un seul fichier à
 * éditer, sans chasse aux URL dans les composants.
 */
export const MEDIAS = {
  heroVideo:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260611_130946_e6793cc7-6b6f-4035-9852-44290b781ae6.mp4',

  nuageTransition:
    'https://soft-zoom-63098134.figma.site/_assets/v11/b4653ee7c7405b6d07f43fffdc3cbdd84d9dfc70.png',

  colombe:
    'https://soft-zoom-63098134.figma.site/_assets/v11/779ed5f1e5b99d3fa582a54133271d32deee567e.png',

  voileBas:
    'https://soft-zoom-63098134.figma.site/_assets/v11/c536f05c69de65726fe598137058c1e477d2badc.png',

  fondShowcase:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260616_040223_98d314e9-b8b4-4218-bcbd-18ffc38032ac.png&w=1280&q=85',

  fondCitation:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260616_042421_41f4fa0b-770c-4545-a416-73a809366e49.png&w=1280&q=85',
};

/**
 * Hôtes tiers à autoriser dans la CSP tant que les médias ne sont pas rapatriés.
 *
 * `fontes` et `styles` sont vides depuis que Cormorant et Archivo sont
 * auto-hébergées : `font-src 'self'` et `style-src 'self'` sont revenus à leur
 * forme stricte. Les deux listes restent déclarées pour que la structure ne
 * change pas le jour où il faudrait rouvrir l'une d'elles — et pour que
 * `public/.htaccess`, qui doit rester le miroir de ce fichier, garde les mêmes
 * directives dans le même ordre.
 */
export const HOTES_MEDIAS = {
  images: ['https://images.higgs.ai', 'https://soft-zoom-63098134.figma.site'],
  video: ['https://d8j0ntlcm91z4.cloudfront.net'],
  fontes: [],
  styles: [],
};
