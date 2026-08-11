import type { PowerLineKind, Substation, SubstationTypology, VoltageClass } from '../shared/types';

/** Shared hex palette for voltage classes, reused by substation markers, power
 *  line paint expressions, the legend and popups so every representation of a
 *  given voltage tier stays visually consistent. Single light-theme palette
 *  (the site has no dark mode) chosen for contrast against the positron
 *  basemap. */
export const VOLTAGE_COLORS: Record<VoltageClass, string> = {
  high: '#dc2626',
  medium: '#b45309',
  low: '#0891b2',
  unknown: '#64748b',
};

export type TypologyMeta = {
  color: string;
  labelKey: string;
  subKey: string;
  capacityNoteKey: string;
  urbanismNoteKey: string;
};

export const TYPOLOGY_ORDER: readonly SubstationTypology[] = ['high', 'medium', 'low'];

export const TYPOLOGY_META: Record<SubstationTypology, TypologyMeta> = {
  high: {
    color: VOLTAGE_COLORS.high,
    labelKey: 'map:typology.high.label',
    subKey: 'map:typology.high.sub',
    capacityNoteKey: 'map:typology.high.capacityNote',
    urbanismNoteKey: 'map:typology.high.urbanismNote',
  },
  medium: {
    color: VOLTAGE_COLORS.medium,
    labelKey: 'map:typology.medium.label',
    subKey: 'map:typology.medium.sub',
    capacityNoteKey: 'map:typology.medium.capacityNote',
    urbanismNoteKey: 'map:typology.medium.urbanismNote',
  },
  low: {
    color: VOLTAGE_COLORS.low,
    labelKey: 'map:typology.low.label',
    subKey: 'map:typology.low.sub',
    capacityNoteKey: 'map:typology.low.capacityNote',
    urbanismNoteKey: 'map:typology.low.urbanismNote',
  },
};

export const countByTypology = (list: readonly Substation[]): Record<SubstationTypology, number> => {
  const counts: Record<SubstationTypology, number> = { high: 0, medium: 0, low: 0 };
  list.forEach((substation) => {
    counts[substation.typology] += 1;
  });
  return counts;
};

export const isSubstationTypology = (value: unknown): value is SubstationTypology =>
  value === 'high' || value === 'medium' || value === 'low';

export const isVoltageClass = (value: unknown): value is VoltageClass =>
  value === 'high' || value === 'medium' || value === 'low' || value === 'unknown';

export const isPowerLineKind = (value: unknown): value is PowerLineKind =>
  value === 'overhead' || value === 'underground';
