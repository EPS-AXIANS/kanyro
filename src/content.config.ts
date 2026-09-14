import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Réalisations — un fichier Markdown par chantier livré.
 *
 * `brouillon: true` retire la fiche du site sans supprimer le fichier : c'est le
 * réglage par défaut du gabarit, pour qu'un exemple ne parte jamais en production
 * par accident.
 *
 * Règle de fond : on ne publie ici que des chantiers réellement livrés, avec
 * l'accord du client. Des références inventées se repèrent (un artisan du coin
 * connaît les autres artisans du coin) et coûtent la réputation qu'elles étaient
 * censées construire.
 */
const realisations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/realisations' }),
  schema: ({ image }) => z.object({
    titre: z.string(),
    client: z.string(),
    metier: z.string(),
    commune: z.string(),
    date: z.coerce.date(),
    resume: z.string(),
    /** La description des moteurs de recherche, 155 caractères au plus. Le
     *  résumé sert de repli, mais il est souvent deux fois trop long. */
    description: z.string().max(160).optional(),
    /** Chiffres vérifiables uniquement — pas d'estimation présentée comme un résultat. */
    resultats: z
      .array(
        z.object({
          valeur: z.string(),
          libelle: z.string(),
        })
      )
      .default([]),
    /**
     * Captures d'écran du site livré. Des captures RÉELLES du travail : jamais
     * une illustration, jamais un montage. `appareil` dit sur quel écran elle a
     * été prise, et décide de sa mise en page (large pour l'ordinateur,
     * étroite pour le téléphone). La première capture « ordinateur » sert de
     * vignette sur la liste des réalisations et sur l'accueil.
     *
     * Le champ `image`, qui le précédait, était déclaré mais jamais affiché :
     * une fiche avec image se serait publiée sans elle.
     */
    captures: z
      .array(
        z.object({
          src: image(),
          alt: z.string().min(10),
          appareil: z.enum(['ordinateur', 'telephone']),
          legende: z.string().optional(),
        })
      )
      .default([]),
    /** Le site en production. Sa présence fait basculer la fiche de « maquette
     *  livrée » à « mis en ligne », et fait apparaître le lien « voir le site ». */
    enLigne: z.string().url().optional(),
    /**
     * Où regarder le travail tant qu'il n'est pas en production : une
     * prévisualisation déployée, un dépôt.
     *
     * Champ SÉPARÉ d'`enLigne`, et pas un repli sur lui : une maquette n'est pas
     * un site en ligne, et confondre les deux ferait écrire « mis en ligne »
     * au-dessus d'un lien qui ne mène pas au site du client.
     */
    maquette: z.string().url().optional(),
    brouillon: z.boolean().default(true),
  }),
});

/**
 * Guides — un fichier Markdown par question que les artisans posent avant
 * d'acheter.
 *
 * Ce sont les seules pages du site qui ne parlent pas de Kanyro. Elles existent
 * pour deux raisons : répondre à ce qui se tape vraiment dans un moteur de
 * recherche (« combien coûte un site internet pour un artisan »), et montrer en
 * le faisant ce que le site vend. Un prestataire de référencement dont le
 * propre site n'a que onze adresses se juge tout seul.
 *
 * Règle de fond, la même qu'ailleurs : aucun chiffre inventé. Les montants
 * cités sont ceux du site (src/data/offres.js) ou des ordres de grandeur
 * annoncés comme tels. Ce qui n'est pas vérifiable ne s'écrit pas.
 */
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    titre: z.string(),
    /** La description des moteurs de recherche, 160 caractères au plus. */
    description: z.string().max(160),
    /** Le chapeau, sous le titre : ce que le lecteur saura en repartant. */
    chapeau: z.string(),
    date: z.coerce.date(),
    /** À renseigner quand le fond change, pas pour une virgule. */
    miseAJour: z.coerce.date().optional(),
    brouillon: z.boolean().default(true),
  }),
});

export const collections = { realisations, guides };
