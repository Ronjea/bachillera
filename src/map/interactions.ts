import type { Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl';
import { applyFilters } from './filters';
import { showPowerLinePopup, showSubstationPopup } from './popup';
import { POWER_LINE_LAYER_IDS } from './power-line-layers';
import { setActiveMunicipality } from './state';

const SUBSTATION_LAYER_ID = 'substation-circles';
const CLUSTER_LAYER_ID = 'cluster-circles';
const CLICKABLE_LAYER_IDS = [SUBSTATION_LAYER_ID, ...POWER_LINE_LAYER_IDS];

const setPointerCursor = (map: MapLibreMap, layerIds: readonly string[]): void => {
  map.on('mouseenter', [...layerIds], () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', [...layerIds], () => {
    map.getCanvas().style.cursor = '';
  });
};

const findByLayerId = (features: MapGeoJSONFeature[] | undefined, layerId: string): MapGeoJSONFeature | undefined =>
  features?.find((feature) => feature.layer.id === layerId);

let interactionsRegistered = false;

/** Registers every map click/hover interaction exactly once — event
 *  listeners survive for the lifetime of the map (there is no style
 *  switching in this app), so calling this twice would double-fire
 *  everything. */
export const registerMapInteractions = (map: MapLibreMap): void => {
  if (interactionsRegistered) return;
  interactionsRegistered = true;

  // One delegated handler for substations + both line layers: a substation
  // marker always wins when a click lands on overlapping features, since it
  // is the more specific target.
  map.on('click', CLICKABLE_LAYER_IDS, (event) => {
    const substationFeature = findByLayerId(event.features, SUBSTATION_LAYER_ID);
    if (substationFeature) {
      showSubstationPopup(map, substationFeature);
      return;
    }
    const lineFeature = event.features?.[0];
    if (lineFeature) showPowerLinePopup(map, event.lngLat, lineFeature);
  });
  setPointerCursor(map, CLICKABLE_LAYER_IDS);

  map.on('click', CLUSTER_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const municipality = feature.properties.municipality;
    if (typeof municipality !== 'string') return;

    setActiveMunicipality(municipality);
    const select = document.querySelector<HTMLSelectElement>('#municipioFilter');
    if (select) select.value = municipality;
    applyFilters(map);

    if (feature.geometry.type === 'Point') {
      map.flyTo({ center: feature.geometry.coordinates as [number, number], zoom: 12, duration: 700 });
    }
  });
  setPointerCursor(map, [CLUSTER_LAYER_ID]);
};
