import { t } from '../i18n';
import type { BeforeAfterPair, MemoryPhoto, MemoryVideo, PressReport } from '../shared/types';
import { GROUP_ORDER } from './catalog';

export const IMAGE_BASE = `${import.meta.env.BASE_URL}images/memoria/`;

export const photoUrl = (id: string, variant: 'full' | 'thumb'): string =>
  `${IMAGE_BASE}${id}${variant === 'thumb' ? '-thumb' : ''}.jpg`;

/** Catalog text comes from third-party archive metadata, so it is escaped
 *  before being interpolated into markup. */
export const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const sizeAttributes = ({ width, height }: { width: number | null; height: number | null }): string =>
  width && height ? `width="${width}" height="${height}"` : '';

const emptyState = (key: string): string => `<p class="memory-empty">${t(key)}</p>`;

const renderPhotoCard = (photo: MemoryPhoto, index: number): string => `
  <li>
    <button type="button" class="photo-card" data-photo-index="${index}" data-testid="photo-${escapeHtml(photo.id)}">
      <span class="photo-card-frame">
        <img src="${photoUrl(photo.id, 'thumb')}" alt="${escapeHtml(photo.alt)}" ${sizeAttributes(photo)} loading="lazy" decoding="async" />
      </span>
      <span class="photo-card-caption">
        <span class="photo-card-date">${escapeHtml(photo.date)}</span>
        <span class="photo-card-title">${escapeHtml(photo.alt)}</span>
      </span>
    </button>
  </li>`;

/** Renders the photo grid grouped by theme; `onOpen` receives the index of
 *  the photo within `photos`, which is the lightbox's navigation order. */
export const renderGallery = (photos: MemoryPhoto[], onOpen: (index: number) => void): void => {
  const mount = document.getElementById('photoGallery');
  if (!mount) return;

  if (photos.length === 0) {
    mount.innerHTML = emptyState('memory:gallery.empty');
    return;
  }

  const indexed = photos.map((photo, index) => ({ photo, index }));
  mount.innerHTML = GROUP_ORDER.map((group) => {
    const items = indexed.filter(({ photo }) => photo.group === group);
    if (items.length === 0) return '';
    return `
      <div class="photo-group">
        <h3 class="photo-group-title">${t(`memory:gallery.groups.${group}`)}</h3>
        <ul class="photo-grid">${items.map(({ photo, index }) => renderPhotoCard(photo, index)).join('')}</ul>
      </div>`;
  }).join('');

  mount.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const card = event.target.closest<HTMLElement>('[data-photo-index]');
    if (card?.dataset.photoIndex) onOpen(Number(card.dataset.photoIndex));
  });
};

const renderPairSide = (pair: BeforeAfterPair, side: 'before' | 'after'): string => {
  const image = pair[side];
  return `
    <figure class="pair-side">
      <span class="pair-label">${t(`memory:beforeAfter.${side}`)} · ${escapeHtml(image.date)}</span>
      <img src="${photoUrl(`${pair.id}-${side}`, 'full')}" alt="${escapeHtml(`${image.title} (${image.date})`)}" loading="lazy" decoding="async" />
      <figcaption><a href="${escapeHtml(image.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(image.credit)}</a></figcaption>
    </figure>`;
};

/** The section ships hidden and is only revealed when there are pairs. */
export const renderBeforeAfter = (pairs: BeforeAfterPair[]): void => {
  const section = document.getElementById('antes-ahora');
  const mount = document.getElementById('beforeAfterList');
  if (!section || !mount || pairs.length === 0) return;

  mount.innerHTML = pairs
    .map(
      (pair) => `
      <article class="pair">
        <h3 class="pair-title">${escapeHtml(pair.title)} <span class="pair-place">${escapeHtml(pair.place)}</span></h3>
        <div class="pair-images">${renderPairSide(pair, 'before')}${renderPairSide(pair, 'after')}</div>
      </article>`,
    )
    .join('');
  section.hidden = false;
};

export const renderVideos = (videos: MemoryVideo[]): void => {
  const mount = document.getElementById('videoList');
  if (!mount) return;

  if (videos.length === 0) {
    mount.innerHTML = emptyState('memory:videos.empty');
    return;
  }

  mount.innerHTML = videos
    .map(
      (video) => `
      <article class="video-card" data-testid="video-${escapeHtml(video.id)}">
        <div class="video-frame">
          <iframe src="https://archive.org/embed/${encodeURIComponent(video.archiveId)}" title="${escapeHtml(video.title)}" loading="lazy" allow="fullscreen" allowfullscreen></iframe>
        </div>
        <div class="video-body">
          <span class="photo-card-date">${escapeHtml(video.date)}</span>
          <h3 class="video-title">${escapeHtml(video.title)}</h3>
          <p class="video-desc">${escapeHtml(video.description)}</p>
          <a class="video-link" href="${escapeHtml(video.sourceUrl)}" target="_blank" rel="noopener">${t('memory:videos.watch')} · ${escapeHtml(video.license)}</a>
        </div>
      </article>`,
    )
    .join('');
};

const formatReportDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year) return isoDate;
  if (!month) return String(year);
  const options: Intl.DateTimeFormatOptions = day
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { month: 'long', year: 'numeric' };
  return new Date(Date.UTC(year, month - 1, day || 1)).toLocaleDateString('es-ES', { ...options, timeZone: 'UTC' });
};

export const renderReports = (reports: PressReport[]): void => {
  const mount = document.getElementById('reportList');
  if (!mount) return;

  if (reports.length === 0) {
    mount.innerHTML = emptyState('memory:reports.empty');
    return;
  }

  const newestFirst = [...reports].sort((a, b) => b.date.localeCompare(a.date));
  mount.innerHTML = newestFirst
    .map(
      (report) => `
      <a class="report-card" href="${escapeHtml(report.url)}" target="_blank" rel="noopener" data-testid="report-${escapeHtml(report.id)}">
        <span class="report-meta">
          <span class="report-kind">${t(`memory:reports.kinds.${report.kind}`)}</span>
          ${escapeHtml(report.outlet)} · ${formatReportDate(report.date)}
        </span>
        <h3 class="report-title">${escapeHtml(report.title)}</h3>
        <p class="report-summary">${escapeHtml(report.summary)}</p>
        <span class="cta-card-link">${t('memory:reports.read')}</span>
      </a>`,
    )
    .join('');
};
