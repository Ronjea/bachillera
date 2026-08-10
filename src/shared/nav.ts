import '../styles/nav.css';
import { currentLocale, onLocaleChange, setLocale, t, SUPPORTED_LOCALES } from '../i18n';
import type { Locale } from '../i18n';

export type PageId = 'home' | 'map' | 'documents';

type NavOptions = {
  current: PageId;
};

const PAGES: Array<{ id: PageId; href: string; labelKey: string }> = [
  { id: 'home', href: 'index.html', labelKey: 'common:nav.home' },
  { id: 'map', href: 'mapa.html', labelKey: 'common:nav.map' },
  { id: 'documents', href: 'documentos.html', labelKey: 'common:nav.documents' },
];

/** Renders the shared site navigation into `#siteNav`. Call once per page. */
export const initSiteNav = ({ current }: NavOptions): void => {
  const mount = document.getElementById('siteNav');
  if (!mount) return;

  const render = (): void => {
    const locale = currentLocale();

    const links = PAGES.map(
      ({ id, href, labelKey }) =>
        `<a href="${href}" ${id === current ? 'aria-current="page"' : ''} data-testid="nav-${id}">${t(labelKey)}</a>`,
    ).join('');

    const langButtons = SUPPORTED_LOCALES.map(
      (code) =>
        `<button type="button" data-locale="${code}" aria-pressed="${code === locale}" aria-label="${t(`common:lang.${code}`)}" data-testid="nav-lang-${code}">${code.toUpperCase()}</button>`,
    ).join('');

    mount.innerHTML = `
      <div class="site-nav">
        <a class="site-nav-brand" href="index.html">${t('common:siteName')}</a>
        <nav class="site-nav-links" aria-label="${t('common:nav.label')}">${links}</nav>
        <div class="site-nav-actions">
          <div class="lang-switch" role="group" aria-label="${t('common:lang.label')}">${langButtons}</div>
        </div>
      </div>
    `;

    mount.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
      button.addEventListener('click', () => {
        void setLocale(button.dataset.locale as Locale);
      });
    });
  };

  render();
  onLocaleChange(render);
};
