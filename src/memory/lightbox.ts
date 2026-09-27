import { t } from '../i18n';
import type { MemoryPhoto } from '../shared/types';
import { escapeHtml, photoUrl } from './gallery';

/**
 * Wires the native <dialog> photo viewer and returns the function that opens
 * it at a given photo index. The dialog handles Esc and focus trapping; arrow
 * keys and the prev/next buttons wrap around the whole catalog.
 */
export const initLightbox = (photos: MemoryPhoto[]): ((index: number) => void) => {
  const dialog = document.getElementById('photoLightbox');
  if (!(dialog instanceof HTMLDialogElement) || photos.length === 0) return () => undefined;

  const image = dialog.querySelector<HTMLImageElement>('.lightbox-image');
  const caption = dialog.querySelector<HTMLElement>('.lightbox-caption');
  let current = 0;

  const show = (index: number): void => {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    if (!photo || !image || !caption) return;

    image.src = photoUrl(photo.id, 'full');
    image.alt = photo.alt;
    caption.innerHTML = `
      <span class="lightbox-counter">${t('memory:lightbox.counter', { current: current + 1, total: photos.length })}</span>
      <strong class="lightbox-title">${escapeHtml(photo.alt)}</strong>
      <span class="lightbox-credit">«${escapeHtml(photo.title)}» · ${escapeHtml(photo.date)} · ${escapeHtml(photo.credit)} ·
        <a href="${escapeHtml(photo.licenseUrl)}" target="_blank" rel="noopener license">${escapeHtml(photo.license)}</a></span>
      <a class="lightbox-source" href="${escapeHtml(photo.sourceUrl)}" target="_blank" rel="noopener">${t('memory:lightbox.source')}</a>`;
  };

  dialog.addEventListener('click', (event) => {
    // A click on the backdrop targets the dialog element itself.
    if (event.target === dialog) {
      dialog.close();
      return;
    }
    if (!(event.target instanceof Element)) return;
    const action = event.target.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'close') dialog.close();
    if (action === 'prev') show(current - 1);
    if (action === 'next') show(current + 1);
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });

  return (index: number) => {
    show(index);
    dialog.showModal();
  };
};
