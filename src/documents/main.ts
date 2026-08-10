import '../styles/tokens.css';
import { initI18n, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';

const init = async (): Promise<void> => {
  await initI18n();
  initSiteNav({ current: 'documents' });
  translateDom();
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
