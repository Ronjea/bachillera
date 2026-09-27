import '../styles/nav.css';
import { t } from '../i18n';

export type PageId = 'home' | 'memory' | 'map' | 'documents';

type NavOptions = {
  current: PageId;
};

const PAGES: Array<{ id: PageId; href: string; labelKey: string }> = [
  { id: 'home', href: 'index.html', labelKey: 'common:nav.home' },
  { id: 'memory', href: 'memoria.html', labelKey: 'common:nav.memory' },
  { id: 'map', href: 'mapa.html', labelKey: 'common:nav.map' },
  { id: 'documents', href: 'documentos.html', labelKey: 'common:nav.documents' },
];

/** Renders the shared site navigation into `#siteNav`. Call once per page. */
export const initSiteNav = ({ current }: NavOptions): void => {
  const mount = document.getElementById('siteNav');
  if (!mount) return;

  const links = PAGES.map(
    ({ id, href, labelKey }) =>
      `<a href="${href}" ${id === current ? 'aria-current="page"' : ''} data-testid="nav-${id}">${t(labelKey)}</a>`,
  ).join('');

  mount.innerHTML = `
    <div class="site-nav">
      <a class="site-nav-brand" href="index.html">${t('common:siteName')}</a>
      <nav class="site-nav-links" aria-label="${t('common:nav.label')}">${links}</nav>
    </div>
  `;
};
