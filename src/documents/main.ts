import { initI18n, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';

// The archive page keeps its own fixed "paper" aesthetic: no theme handling.
const init = async (): Promise<void> => {
  await initI18n();
  initSiteNav({ current: 'documents', skin: 'paper' });
  translateDom();
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
