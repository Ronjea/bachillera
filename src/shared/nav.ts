import '../styles/nav.css';
import { currentLocale, onLocaleChange, setLocale, t, SUPPORTED_LOCALES } from '../i18n';
import type { Locale } from '../i18n';
import { getCurrentTheme, onThemeChange, toggleTheme } from './theme';

export type PageId = 'home' | 'map' | 'documents';
export type NavSkin = 'default' | 'paper';

type NavOptions = {
  current: PageId;
  /** "paper" hides the theme toggle and uses the archival palette. */
  skin?: NavSkin;
};

const PAGES: Array<{ id: PageId; href: string; labelKey: string }> = [
  { id: 'home', href: 'index.html', labelKey: 'common:nav.home' },
  { id: 'map', href: 'mapa.html', labelKey: 'common:nav.map' },
  { id: 'documents', href: 'documentos.html', labelKey: 'common:nav.documents' },
];

const SUN_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
const MOON_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

/** Renders the shared site navigation into `#siteNav`. Call once per page. */
export const initSiteNav = ({ current, skin = 'default' }: NavOptions): void => {
  const mount = document.getElementById('siteNav');
  if (!mount) return;

  const render = (): void => {
    const locale = currentLocale();
    const theme = getCurrentTheme();

    const links = PAGES.map(
      ({ id, href, labelKey }) =>
        `<a href="${href}" ${id === current ? 'aria-current="page"' : ''} data-testid="nav-${id}">${t(labelKey)}</a>`,
    ).join('');

    const langButtons = SUPPORTED_LOCALES.map(
      (code) =>
        `<button type="button" data-locale="${code}" aria-pressed="${code === locale}" aria-label="${t(`common:lang.${code}`)}" data-testid="nav-lang-${code}">${code.toUpperCase()}</button>`,
    ).join('');

    const themeButton =
      skin === 'default'
        ? `<button type="button" class="theme-btn" data-action="toggle-theme" aria-label="${t(theme === 'dark' ? 'common:theme.toLight' : 'common:theme.toDark')}" data-testid="nav-theme-toggle">${theme === 'dark' ? SUN_ICON : MOON_ICON}</button>`
        : '';

    mount.innerHTML = `
      <div class="site-nav" data-skin="${skin}">
        <a class="site-nav-brand" href="index.html">${t('common:siteName')}</a>
        <nav class="site-nav-links" aria-label="${t('common:nav.label')}">${links}</nav>
        <div class="site-nav-actions">
          <div class="lang-switch" role="group" aria-label="${t('common:lang.label')}">${langButtons}</div>
          ${themeButton}
        </div>
      </div>
    `;

    mount.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
      button.addEventListener('click', () => {
        void setLocale(button.dataset.locale as Locale);
      });
    });
    mount
      .querySelector<HTMLButtonElement>('[data-action="toggle-theme"]')
      ?.addEventListener('click', () => toggleTheme());
  };

  render();
  onLocaleChange(render);
  onThemeChange(render);
};
