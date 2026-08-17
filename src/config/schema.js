import { SITE, urlAbsolue } from './site.js';

/**
 * JSON-LD de l'agence.
 *
 * `ProfessionalService` plutôt que `Organization` : c'est le type qui déclenche
 * les résultats enrichis locaux, et le référencement local est le canal
 * principal. `areaServed` liste les communes réellement couvertes — mentir
 * dessus se paie en signaux incohérents.
 */
export function agenceJsonLd(communes = []) {
  const noeud = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': urlAbsolue('/#agence'),
    name: SITE.nom,
    description: SITE.baseline,
    url: SITE.url,
    email: SITE.contact.email,
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.zone.ville,
      postalCode: SITE.zone.codePostal,
      addressRegion: SITE.zone.region,
      addressCountry: SITE.zone.pays,
    },
    areaServed: communes.map((c) => ({
      '@type': 'City',
      name: typeof c === 'string' ? c : c.nom,
    })),
  };

  if (SITE.contact.telephone) noeud.telephone = SITE.contact.telephone;

  const reseaux = Object.values(SITE.reseaux).filter(Boolean);
  if (reseaux.length) noeud.sameAs = reseaux;

  return noeud;
}

/** Fil d'Ariane — aide Google à afficher le chemin plutôt que l'URL brute. */
export function filAriane(elements) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: elements.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.nom,
      item: urlAbsolue(e.chemin),
    })),
  };
}

/** Page de service : un métier couvert sur une commune donnée. */
export function serviceJsonLd({ metier, commune, chemin, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Création de site internet pour ${metier} à ${commune}`,
    description,
    url: urlAbsolue(chemin),
    serviceType: 'Création de site internet et référencement local',
    provider: { '@id': urlAbsolue('/#agence') },
    areaServed: { '@type': 'City', name: commune },
  };
}
