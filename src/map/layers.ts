import type { Map as MapLibreMap } from 'maplibre-gl';
import { buildMunicipalityClusters, getFilteredSubstations, toSubstationsGeoJSON } from './filters';
import { addPowerLineLayers } from './power-line-layers';
import { emptyRouteCollection, emptyUserPointCollection, getRouteData, getUserPointData } from './state';
import { isChecked } from './dom';
import { VOLTAGE_COLORS } from './typology';

/** Adds every source and layer this app owns: substations, municipality
 *  clusters, the proximity route/user-point overlay, and the power lines
 *  layers. Called once after the basemap fires `load` — there is no style
 *  switching in this app, so this never needs to run twice. */
export const addDataLayers = (map: MapLibreMap): void => {
  const filtered = getFilteredSubstations();

  map.addSource('substations', { type: 'geojson', data: toSubstationsGeoJSON(filtered) });
  map.addSource('clusters', { type: 'geojson', data: buildMunicipalityClusters(filtered) });
  map.addSource('route', { type: 'geojson', data: getRouteData() ?? emptyRouteCollection() });
  map.addSource('user-point', { type: 'geojson', data: getUserPointData() ?? emptyUserPointCollection() });

  const markersVisible = isChecked('#layerMarkers', true);
  const heatmapVisible = isChecked('#layerHeatmap', false);
  const clustersVisible = isChecked('#layerClusters', false);

  map.addLayer({
    id: 'heat-layer',
    type: 'heatmap',
    source: 'substations',
    maxzoom: 13,
    layout: { visibility: heatmapVisible ? 'visible' : 'none' },
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'maxVoltageKv'], 66, 0.4, 220, 1, 400, 1.3],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 1, 13, 2.5],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 14, 13, 34],
      'heatmap-opacity': 0.85,
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0,0,0,0)',
        0.2, 'rgba(34,211,238,0.45)',
        0.4, 'rgba(251,191,36,0.55)',
        0.7, 'rgba(249,115,22,0.75)',
        1, 'rgba(239,68,68,0.9)',
      ],
    },
  });

  map.addLayer({
    id: 'cluster-circles',
    type: 'circle',
    source: 'clusters',
    layout: { visibility: clustersVisible ? 'visible' : 'none' },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 10, 5, 20, 15, 34],
      'circle-color': '#fbbf24',
      'circle-opacity': 0.22,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fbbf24',
      'circle-stroke-opacity': 0.8,
    },
  });

  map.addLayer({
    id: 'cluster-labels',
    type: 'symbol',
    source: 'clusters',
    layout: {
      visibility: clustersVisible ? 'visible' : 'none',
      'text-field': ['get', 'count'],
      'text-size': 12,
      'text-font': ['Noto Sans Bold'],
    },
    paint: { 'text-color': '#fbbf24', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 },
  });

  map.addLayer({
    id: 'substation-circles',
    type: 'circle',
    source: 'substations',
    layout: { visibility: markersVisible ? 'visible' : 'none' },
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        ['match', ['get', 'typology'], 'high', 6, 'medium', 5, 4],
        14,
        ['match', ['get', 'typology'], 'high', 11, 'medium', 9, 7],
      ],
      'circle-color': [
        'match',
        ['get', 'typology'],
        'high',
        VOLTAGE_COLORS.high,
        'medium',
        VOLTAGE_COLORS.medium,
        'low',
        VOLTAGE_COLORS.low,
        VOLTAGE_COLORS.unknown,
      ],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#0a0e13',
      'circle-opacity': 0.92,
    },
  });

  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    paint: { 'line-color': '#fbbf24', 'line-width': 2.5, 'line-dasharray': [2, 2] },
  });

  map.addLayer({
    id: 'user-point-layer',
    type: 'circle',
    source: 'user-point',
    paint: {
      'circle-radius': 8,
      'circle-color': '#22d3ee',
      'circle-stroke-width': 3,
      'circle-stroke-color': '#0a0e13',
    },
  });

  addPowerLineLayers(map);
};
