import '../styles/tokens.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/map.css';
import { createIcons, icons } from 'lucide';
import { initI18n, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';
import esMap from '../i18n/locales/es/map.json';
import { fetchPowerLines, fetchSubstations } from './data';
import { initFilters } from './filters';
import { registerMapInteractions } from './interactions';
import { addDataLayers } from './layers';
import { disablePowerLineControls, initLayerToggles } from './layer-toggles';
import { renderMapLegend } from './legend';
import { createMap } from './map-factory';
import { initProximityTool } from './proximity';
import { initSidebarToggle } from './sidebar';
import { setAllSubstations, setPowerLines } from './state';
import { renderStats } from './stats';
import { initViewPresets } from './view-presets';

const init = async (): Promise<void> => {
  await initI18n([{ locale: 'es', namespace: 'map', resources: esMap }]);
  initSiteNav({ current: 'map' });
  translateDom();

  const [substations, powerLines] = await Promise.all([fetchSubstations(), fetchPowerLines()]);
  setAllSubstations(substations);
  setPowerLines(powerLines);
  if (!powerLines) disablePowerLineControls();

  const map = createMap('map');
  map.on('load', () => {
    addDataLayers(map);
    registerMapInteractions(map);
  });

  renderStats();
  initFilters(map);
  renderMapLegend();
  initLayerToggles(map);
  initViewPresets(map);
  initProximityTool(map);
  initSidebarToggle(map);

  createIcons({ icons });
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
