import { Map as MapLibreMap, NavigationControl, ScaleControl, setWorkerUrl } from 'maplibre-gl';
// Vite's "?worker&url" suffix resolves to a bundled, self-contained worker
// chunk's final URL string at build time (see comment below for why this is
// necessary at all).
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { BBOX_PROVINCE, MAP_STYLE } from './constants';

// MapLibre spawns its own Web Worker by asking `getWorkerUrl()` for a URL at
// runtime rather than using a statically analyzable `new Worker(new URL(...))`
// call — bundlers can't detect that automatically, so its worker chunk never
// gets emitted otherwise (confirmed via network inspection: the default
// worker URL 404s in both dev and the production build). Pointing it at a
// bundler-processed URL fixes tile rendering; without this, the map mounts
// but never gets tiles, markers, or any layer image data.
setWorkerUrl(maplibreWorkerUrl as string);

/** Builds the MapLibre instance with the shared basemap, initial bounds and
 *  chrome controls. Does not add data sources/layers or register
 *  interactions — callers wire those up once the map fires `load`. */
export const createMap = (container: HTMLElement | string): MapLibreMap => {
  const map = new MapLibreMap({
    container,
    style: MAP_STYLE,
    bounds: BBOX_PROVINCE,
    fitBoundsOptions: { padding: 40 },
  });

  map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-right');

  if (import.meta.env.DEV) {
    // Dev-only handle for debugging and scripted QA; stripped from builds.
    (window as unknown as { __map?: MapLibreMap }).__map = map;
  }

  return map;
};
