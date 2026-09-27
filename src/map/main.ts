import '../styles/tokens.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/map.css';
import { createIcons, icons } from 'lucide';
import { initI18n, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';
import esMap from '../i18n/locales/es/map.json';
import esLegal from '../i18n/locales/es/legal.json';
import { fetchPowerLines, fetchSubstations } from './data';
import { initFilters } from './filters';
import { registerMapInteractions } from './interactions';
import { addDataLayers } from './layers';
import { disablePowerLineControls, initLayerToggles } from './layer-toggles';
import { renderMapLegend } from './legend';
import { BBOX_BACHILLERA } from './constants';
import { createMap } from './map-factory';
import { initProximityTool } from './proximity';
import { initSidebarToggle } from './sidebar';
import { setAllSubstations, setPowerLines } from './state';
import { renderStats } from './stats';
import { initViewPresets } from './view-presets';

const init = async (): Promise<void> => {
  await initI18n([
    { locale: 'es', namespace: 'map', resources: esMap },
    { locale: 'es', namespace: 'legal', resources: esLegal },
  ]);
  // The full map is a tool of the power-lines movement, so the nav highlights it.
  initSiteNav({ current: 'movements' });
  translateDom();

  const [substations, powerLines] = await Promise.all([fetchSubstations(), fetchPowerLines()]);
  setAllSubstations(substations);
  setPowerLines(powerLines);
  if (!powerLines) disablePowerLineControls();

  // Visitors arrive from the power-lines movement, so start on the barrio.
  const map = createMap('map', { bounds: BBOX_BACHILLERA });
  map.on('load', () => {
    addDataLayers(map);
    registerMapInteractions(map);
  });

  renderStats();
  initFilters(map);
  renderMapLegend();
  initLayerToggles(map);
  initViewPresets(map, 'bachillera');
  initProximityTool(map);
  initSidebarToggle(map);

  createIcons({ icons });
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
