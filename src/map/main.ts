import '../styles/tokens.css';
import '../styles/map.css';
import { initI18n, translateDom } from '../i18n';
import { initTheme } from '../shared/theme';
import { initSiteNav } from '../shared/nav';
import esMap from '../i18n/locales/es/map.json';
import enMap from '../i18n/locales/en/map.json';

// Placeholder entry — the map worker ports the full legacy app here.
const init = async (): Promise<void> => {
  initTheme();
  await initI18n([
    { locale: 'es', namespace: 'map', resources: esMap },
    { locale: 'en', namespace: 'map', resources: enMap },
  ]);
  initSiteNav({ current: 'map' });
  translateDom();
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
