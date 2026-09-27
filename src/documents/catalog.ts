import catalogJson from './catalog.json';

/** A document can belong to several topics; `lineas`/`calles`/`vivienda`
 *  double as the ids of their matching sections on movimientos.html. */
export type DocumentTopic = 'lineas' | 'calles' | 'vivienda' | 'planeamiento' | 'historia' | 'consulta';

export type DocumentKind = 'oficial' | 'prensa' | 'grupo-municipal' | 'referencia' | 'archivo';

export type ArchiveDocument = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  href: string;
  sourceLabel: string;
  kind: DocumentKind;
  topics: DocumentTopic[];
  date?: string;
  isPdf?: boolean;
  featured?: boolean;
};

/** Topics in the order chips, groups and counts are displayed. */
export const TOPIC_ORDER: readonly DocumentTopic[] = [
  'lineas',
  'calles',
  'vivienda',
  'planeamiento',
  'historia',
  'consulta',
];

const isDocumentTopic = (value: string): value is DocumentTopic =>
  (TOPIC_ORDER as readonly string[]).includes(value);

/** JSON imports widen string unions to `string`, so `topics` is narrowed
 *  here; a document with no valid topic left is dropped and reported in
 *  the console instead of rendering under no heading at all. */
const loadCatalog = (): ArchiveDocument[] =>
  (catalogJson as ArchiveDocument[]).flatMap((doc) => {
    const topics = doc.topics.filter((topic) => isDocumentTopic(topic));
    if (topics.length === 0) {
      console.warn(`documents catalog: "${doc.id}" has no valid topic`);
      return [];
    }
    if (topics.length !== doc.topics.length) {
      console.warn(`documents catalog: "${doc.id}" has an unknown topic, dropped`);
    }
    return [{ ...doc, topics }];
  });

export const catalog: ArchiveDocument[] = loadCatalog();

export const documentsByTopic = (topic: DocumentTopic): ArchiveDocument[] =>
  catalog.filter((doc) => doc.topics.includes(topic));

export const featuredDocuments = (): ArchiveDocument[] => catalog.filter((doc) => doc.featured);
