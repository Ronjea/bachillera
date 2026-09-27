import { t } from '../i18n';
import type { ArchiveDocument } from './catalog';

/** Lowercases and strips accents so "urbanizacion" finds "urbanización"
 *  and "RENFE" finds "Renfe". */
export const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const searchableText = (doc: ArchiveDocument): string =>
  normalize(
    [
      doc.title,
      doc.subtitle ?? '',
      doc.description,
      doc.sourceLabel,
      doc.date ?? '',
      t(`documents:kinds.${doc.kind}`),
      ...doc.topics.map((topic) => t(`documents:chips.${topic}`)),
    ].join(' '),
  );

/** Every word of the query must appear somewhere in the document's text,
 *  so adding words narrows the results instead of widening them. */
export const searchDocuments = (docs: readonly ArchiveDocument[], query: string): ArchiveDocument[] => {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return docs.filter((doc) => {
    const text = searchableText(doc);
    return terms.every((term) => text.includes(term));
  });
};
