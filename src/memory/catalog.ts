import type { MemoryCatalog, MemoryGroup, PressReportKind } from '../shared/types';
import catalogJson from './catalog.json';

const MEMORY_GROUPS: readonly MemoryGroup[] = ['origins', 'daily-life', 'celebrations', 'sport', 'community', 'urbanism'];
const REPORT_KINDS: readonly PressReportKind[] = ['prensa', 'revista', 'institucional', 'blog', 'archivo'];

const isMemoryGroup = (value: string): value is MemoryGroup => MEMORY_GROUPS.some((group) => group === value);
const isReportKind = (value: string): value is PressReportKind => REPORT_KINDS.some((kind) => kind === value);

/** Groups in display order, so the gallery reads roughly chronologically. */
export const GROUP_ORDER = MEMORY_GROUPS;

/**
 * JSON imports widen string unions to `string`, so enum fields are narrowed
 * here. Entries with an unknown group or kind are dropped (and reported in the
 * console) instead of rendering under a missing heading.
 */
const loadCatalog = (): MemoryCatalog => {
  const photos = catalogJson.photos.flatMap((photo) => {
    if (isMemoryGroup(photo.group)) return [{ ...photo, group: photo.group }];
    console.warn(`memory catalog: photo "${photo.id}" has unknown group "${photo.group}"`);
    return [];
  });
  const reports = catalogJson.reports.flatMap((report) => {
    if (isReportKind(report.kind)) return [{ ...report, kind: report.kind }];
    console.warn(`memory catalog: report "${report.id}" has unknown kind "${report.kind}"`);
    return [];
  });
  return { photos, videos: catalogJson.videos, beforeAfter: catalogJson.beforeAfter, reports };
};

export const catalog: MemoryCatalog = loadCatalog();
