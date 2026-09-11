import { SITE, adresseLegale, reseauxActifs, urlAbsolue } from './site.js';
import { offre } from '../data/offres.js';

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
    /*
     * Logo et image : le carré de l'icône (180 px, au-dessus des 112 px que
     * demande Google) et l'image de partage. Le fondateur est le directeur de
     * la publication, avec son profil LinkedIn, tous deux déjà publics.
     */
    logo: urlAbsolue('/apple-touch-icon.png'),
    image: urlAbsolue('/images/partage-kanyro.jpg'),
    founder: {
      '@type': 'Person',
      name: SITE.legal.directeurPublication,
      ...(SITE.reseaux.linkedin && { sameAs: SITE.reseaux.linkedin }),
    },
    priceRange: '€€',
    /*
     * L'offre, avec la fourchette réellement affichée sur la page. Pas de
     * `valueAddedTaxIncluded` : le régime de TVA reste à confirmer à
     * l'immatriculation (voir SITE.legal.tva).
     */
    makesOffer: {
      '@type': 'Offer',
      name: offre.nom,
      description: offre.introduction,
      priceSpecification: {
        '@type': 'PriceSpecification',
        minPrice: offre.prixMin,
        maxPrice: offre.prixMax,
        priceCurrency: 'EUR',
      },
      itemOffered: {
        '@type': 'Service',
        name: 'Création de site internet pour artisan du bâtiment',
        serviceType: 'Création de site internet et référencement local',
      },
    },
    areaServed: communes.map((c) => ({
      '@type': 'City',
      name: typeof c === 'string' ? c : c.nom,
    })),
  };

  /*
   * L'adresse n'est émise que si elle est réelle et complète. Elle valait
   * « Arras et Lille » et « 62000 et 59000 » : deux villes et deux codes postaux
   * dans des champs qui n'en attendent qu'un. Une adresse fausse dans les
   * données structurées est pire qu'une adresse absente — `areaServed` dit déjà
   * où l'agence intervient.
   */
  const adresse = adresseLegale();
  if (adresse) {
    noeud.address = {
      '@type': 'PostalAddress',
      streetAddress: adresse.rue,
      postalCode: adresse.codePostal,
      addressLocality: adresse.ville,
      addressRegion: SITE.zone.region,
      addressCountry: SITE.zone.pays,
    };
  }

  if (SITE.contact.telephone) noeud.telephone = SITE.contact.telephone;

  const reseaux = reseauxActifs().map((r) => r.url);
  if (reseaux.length) noeud.sameAs = reseaux;

  return noeud;
}

/**
 * Les questions de l'accueil en `FAQPage`, lues dans le même fichier que la
 * section (src/data/questions.js) : elles ne peuvent pas dire autre chose
 * que ce que le visiteur lit.
 */
export function faqJsonLd(questions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.r },
    })),
  };
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
