import type { Map as MapLibreMap } from 'maplibre-gl';
import { emptyPowerLinesCollection, getPowerLines } from './state';
import { isChecked } from './dom';
import { VOLTAGE_COLORS } from './typology';

export const CASING_LAYER_ID = 'power-lines-casing';
export const UNDERGROUND_LAYER_ID = 'power-lines-underground';
export const OVERHEAD_LAYER_ID = 'power-lines-overhead';

/** The two clickable/hoverable line layers (casing is a purely visual halo,
 *  never a click/hover target) — used by interactions.ts to register one
 *  delegated handler across substations + both line layers. */
export const POWER_LINE_LAYER_IDS = [OVERHEAD_LAYER_ID, UNDERGROUND_LAYER_ID] as const;

// The voltage-class color *values* below all come from typology.ts's
// VOLTAGE_COLORS (the single source of truth shared with substations, the
// legend and popups) — only the "match" expression *shape* is duplicated
// across the two paint blocks. The maplibre style-spec's expression types
// (e.g. ExpressionSpecification) are internal to `@maplibre/maplibre-gl-style-spec`
// and not exported from the `maplibre-gl` package, so hoisting this into a
// standalone typed constant isn't possible without depending on that
// transitive package directly; inlining it lets each paint object's own
// contextual typing check it instead.

/** Adds the `power-lines` source plus its 3 layers (casing halo, underground,
 *  overhead), all inserted right before `substation-circles` so markers stay
 *  on top. Reads the live toggle checkboxes for initial visibility — call
 *  once, after the substation/cluster layers already exist. */
export const addPowerLineLayers = (map: MapLibreMap): void => {
  const collection = getPowerLines()?.collection ?? emptyPowerLinesCollection();
  map.addSource('power-lines', { type: 'geojson', data: collection });

  const masterVisible = isChecked('#layerLines', true);
  const overheadVisible = masterVisible && isChecked('#layerLinesOverhead', true);
  const undergroundVisible = masterVisible && isChecked('#layerLinesUnderground', true);

  map.addLayer(
    {
      id: CASING_LAYER_ID,
      type: 'line',
      source: 'power-lines',
      layout: {
        visibility: masterVisible ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2, 16, 7],
        'line-opacity': 0.55,
        'line-blur': 0.4,
      },
    },
    'substation-circles',
  );

  map.addLayer(
    {
      id: UNDERGROUND_LAYER_ID,
      type: 'line',
      source: 'power-lines',
      filter: ['==', ['get', 'kind'], 'underground'],
      layout: {
        visibility: undergroundVisible ? 'visible' : 'none',
      },
      paint: {
        'line-color': [
          'match',
          ['get', 'voltageClass'],
          'high',
          VOLTAGE_COLORS.high,
          'medium',
          VOLTAGE_COLORS.medium,
          'low',
          VOLTAGE_COLORS.low,
          VOLTAGE_COLORS.unknown,
        ],
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 16, 4],
        'line-opacity': 0.9,
        'line-dasharray': [2, 2],
      },
    },
    'substation-circles',
  );

  map.addLayer(
    {
      id: OVERHEAD_LAYER_ID,
      type: 'line',
      source: 'power-lines',
      filter: ['==', ['get', 'kind'], 'overhead'],
      layout: {
        visibility: overheadVisible ? 'visible' : 'none',
      },
      paint: {
        'line-color': [
          'match',
          ['get', 'voltageClass'],
          'high',
          VOLTAGE_COLORS.high,
          'medium',
          VOLTAGE_COLORS.medium,
          'low',
          VOLTAGE_COLORS.low,
          VOLTAGE_COLORS.unknown,
        ],
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 16, 4],
        'line-opacity': 0.9,
      },
    },
    'substation-circles',
  );
};
