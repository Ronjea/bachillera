import '../styles/tokens.css';
import '../styles/components.css';
import '../styles/home.css';
import { initI18n, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';
import { renderParticipate } from '../shared/participate';
import { photoUrl } from '../memory/gallery';
import { renderMemoryStrip } from './memory-strip';
import esHome from '../i18n/locales/es/home.json';

/** Archive photo used as the hero background (see memory strip / catalog). */
const HERO_PHOTO_ID = 'mujeres-cubos-agua';

const setHeroImage = (): void => {
  const hero = document.getElementById('hero');
  if (!hero) return;
  hero.style.setProperty('--hero-image', `url("${photoUrl(HERO_PHOTO_ID, 'full')}")`);
};

const init = async (): Promise<void> => {
  await initI18n([{ locale: 'es', namespace: 'home', resources: esHome }]);
  initSiteNav({ current: 'home' });
  translateDom();
  setHeroImage();
  renderMemoryStrip();
  renderParticipate({ mountId: 'participa' });
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
