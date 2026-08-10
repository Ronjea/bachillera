import type { FeatureCollection, Point } from 'geojson';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { t } from '../i18n';
import type { Substation } from '../shared/types';
import {
  getActiveMunicipality,
  getActiveTypologies,
  getAllSubstations,
  setActiveMunicipality,
  toggleTypology,
} from './state';
import { countByTypology, isSubstationTypology, TYPOLOGY_META, TYPOLOGY_ORDER } from './typology';

export const getFilteredSubstations = (): Substation[] => {
  const active = getActiveTypologies();
  const municipality = getActiveMunicipality();
  return getAllSubstations().filter((substation) => {
    if (!active.has(substation.typology)) return false;
    if (municipality && substation.municipality !== municipality) return false;
    return true;
  });
};

export const toSubstationsGeoJSON = (
  list: readonly Substation[],
): FeatureCollection<Point, Substation> => ({
  type: 'FeatureCollection',
  features: list.map((substation) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [substation.lon, substation.lat] },
    properties: substation,
  })),
});

type MunicipalityClusterProperties = { municipality: string; count: number };

export const buildMunicipalityClusters = (
  list: readonly Substation[],
): FeatureCollection<Point, MunicipalityClusterProperties> => {
  const byMunicipality = new Map<string, { lat: number; lon: number; count: number }>();
  list.forEach((substation) => {
    const entry = byMunicipality.get(substation.municipality) ?? { lat: 0, lon: 0, count: 0 };
    entry.lat += substation.lat;
    entry.lon += substation.lon;
    entry.count += 1;
    byMunicipality.set(substation.municipality, entry);
  });

  const features = Array.from(byMunicipality.entries()).map(([municipality, entry]) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [entry.lon / entry.count, entry.lat / entry.count] },
    properties: { municipality, count: entry.count },
  }));
  return { type: 'FeatureCollection', features };
};

/** Recomputes the filtered list, pushes it to the live map sources, and
 *  re-syncs the typology chips' visual (inactive) state. Counts shown on the
 *  chips stay static against the full dataset, matching the legacy app. */
export const applyFilters = (map: MapLibreMap): void => {
  const filtered = getFilteredSubstations();
  map.getSource<GeoJSONSource>('substations')?.setData(toSubstationsGeoJSON(filtered));
  map.getSource<GeoJSONSource>('clusters')?.setData(buildMunicipalityClusters(filtered));

  const active = getActiveTypologies();
  document.querySelectorAll<HTMLButtonElement>('#typologyFilters .filter-chip').forEach((chip) => {
    const key = chip.dataset.key;
    if (isSubstationTypology(key)) chip.classList.toggle('inactive', !active.has(key));
  });
};

export const renderTypologyFilters = (map: MapLibreMap): void => {
  const container = document.querySelector<HTMLDivElement>('#typologyFilters');
  if (!container) return;

  const counts = countByTypology(getAllSubstations());
  const active = getActiveTypologies();

  container.innerHTML = TYPOLOGY_ORDER.map((key) => {
    const meta = TYPOLOGY_META[key];
    const inactiveClass = active.has(key) ? '' : ' inactive';
    return `
      <button type="button" class="filter-chip${inactiveClass}" data-key="${key}" data-testid="chip-filter-${key}">
        <span class="dot" style="background:${meta.color}"></span>
        <span class="fc-label">${t(meta.labelKey)} <span style="color:var(--color-text-faint)">&middot;&nbsp;${t(meta.subKey)}</span></span>
        <span class="fc-count">${counts[key]}</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll<HTMLButtonElement>('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.key;
      if (!isSubstationTypology(key)) return;
      if (toggleTypology(key)) applyFilters(map);
    });
  });
};

export const renderMunicipalitySelect = (): void => {
  const select = document.querySelector<HTMLSelectElement>('#municipioFilter');
  if (!select) return;

  const all = getAllSubstations();
  const counts = new Map<string, number>();
  all.forEach((substation) => {
    counts.set(substation.municipality, (counts.get(substation.municipality) ?? 0) + 1);
  });
  const municipalities = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, 'es'));

  const allOption = `<option value="">${t('map:filters.allMunicipalities', { count: all.length })}</option>`;
  const options = municipalities
    .map((municipality) => `<option value="${municipality}">${municipality} (${counts.get(municipality)})</option>`)
    .join('');

  select.innerHTML = allOption + options;
  select.value = getActiveMunicipality();
};

/** One-time setup: initial render of both filter controls plus the
 *  municipality select's change listener (kept separate from the render
 *  functions above so re-rendering on locale change never double-registers
 *  a listener on the persistent <select> element). */
export const initFilters = (map: MapLibreMap): void => {
  renderTypologyFilters(map);
  renderMunicipalitySelect();

  const select = document.querySelector<HTMLSelectElement>('#municipioFilter');
  if (!select) return;
  select.addEventListener('change', () => {
    setActiveMunicipality(select.value);
    applyFilters(map);
  });
};
