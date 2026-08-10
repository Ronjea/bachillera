import '../styles/tokens.css';
import '../styles/home.css';
import { initI18n, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';
import esHome from '../i18n/locales/es/home.json';

const init = async (): Promise<void> => {
  await initI18n([{ locale: 'es', namespace: 'home', resources: esHome }]);
  initSiteNav({ current: 'home' });
  translateDom();
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
