import '../styles/tokens.css';
import '../styles/components.css';
import '../styles/memory.css';
import { initI18n, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';
import { renderParticipate } from '../shared/participate';
import esMemory from '../i18n/locales/es/memory.json';
import { catalog } from './catalog';
import { renderBeforeAfter, renderGallery, renderReports, renderVideos } from './gallery';
import { initLightbox } from './lightbox';

const init = async (): Promise<void> => {
  await initI18n([{ locale: 'es', namespace: 'memory', resources: esMemory }]);
  initSiteNav({ current: 'memory' });
  translateDom();

  const openPhoto = initLightbox(catalog.photos);
  renderGallery(catalog.photos, openPhoto);
  renderBeforeAfter(catalog.beforeAfter);
  renderVideos(catalog.videos);
  renderReports(catalog.reports);
  renderParticipate({ mountId: 'participa' });
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
