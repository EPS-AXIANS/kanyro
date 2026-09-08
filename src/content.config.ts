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
  schema: z.object({
    titre: z.string(),
    client: z.string(),
    metier: z.string(),
    commune: z.string(),
    date: z.coerce.date(),
    resume: z.string(),
    /** Chiffres vérifiables uniquement — pas d'estimation présentée comme un résultat. */
    resultats: z
      .array(
        z.object({
          valeur: z.string(),
          libelle: z.string(),
        })
      )
      .default([]),
    image: z.string().optional(),
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

export const collections = { realisations };
