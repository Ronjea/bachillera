import '../styles/tokens.css';
import '../styles/home.css';
import { initI18n, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';
import { renderMemoryStrip } from './memory-strip';
import esHome from '../i18n/locales/es/home.json';
import esLegal from '../i18n/locales/es/legal.json';

const init = async (): Promise<void> => {
  await initI18n([
    { locale: 'es', namespace: 'home', resources: esHome },
    { locale: 'es', namespace: 'legal', resources: esLegal },
  ]);
  initSiteNav({ current: 'home' });
  translateDom();
  renderMemoryStrip();
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
