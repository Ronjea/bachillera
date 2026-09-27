import { t } from '../i18n';
import { CONTACT_EMAIL } from './contact';

type ParticipateOptions = {
  /** Element id to render into. The block is skipped if it is missing. */
  mountId: string;
  /** URL offered by the share button. Defaults to the current page. */
  shareUrl?: string;
};

const MAIL_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
const SHARE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>';

const renderEmailAction = (): string =>
  CONTACT_EMAIL
    ? `<div class="button-row"><a class="button button--primary" href="mailto:${CONTACT_EMAIL}" data-testid="participate-email">${MAIL_ICON}${t('common:participate.email.cta')}</a></div>`
    : `<p class="participate-pending" data-testid="participate-email-pending">${t('common:participate.email.pending')}</p>`;

/** Opens the native share sheet (WhatsApp etc. on phones); on browsers
 *  without it, copies the link and says so, so the tap never does nothing. */
export const shareLink = async (url: string, feedback: HTMLElement | null): Promise<void> => {
  const setFeedback = (key: string, isError: boolean): void => {
    if (!feedback) return;
    feedback.textContent = t(key);
    feedback.classList.toggle('participate-feedback--error', isError);
  };

  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, text: t('common:participate.share.text'), url });
    } catch (error) {
      // AbortError = the user closed the share sheet; not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Share failed', error);
      setFeedback('common:participate.share.failed', true);
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    setFeedback('common:participate.share.copied', false);
  } catch (error) {
    console.error('Clipboard write failed', error);
    setFeedback('common:participate.share.failed', true);
  }
};

/** Renders the shared "Participa" block: contact, share and inform. */
export const renderParticipate = ({ mountId, shareUrl }: ParticipateOptions): void => {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  mount.innerHTML = `
    <div class="wrap">
      <p class="eyebrow">${t('common:participate.eyebrow')}</p>
      <h2 class="section-title">${t('common:participate.title')}</h2>
      <p class="section-lede">${t('common:participate.lede')}</p>
      <div class="participate-grid">
        <div class="participate-card">
          <h3 class="participate-card-title">${t('common:participate.email.title')}</h3>
          <p class="participate-card-desc">${t('common:participate.email.description')}</p>
          ${renderEmailAction()}
        </div>
        <div class="participate-card">
          <h3 class="participate-card-title">${t('common:participate.share.title')}</h3>
          <p class="participate-card-desc">${t('common:participate.share.description')}</p>
          <div class="button-row">
            <button type="button" class="button button--primary" data-action="share" data-testid="participate-share">${SHARE_ICON}${t('common:participate.share.cta')}</button>
          </div>
          <p class="participate-feedback" role="status" aria-live="polite"></p>
        </div>
        <div class="participate-card">
          <h3 class="participate-card-title">${t('common:participate.inform.title')}</h3>
          <p class="participate-card-desc">${t('common:participate.inform.description')}</p>
          <div class="button-row">
            <a class="button button--ghost" href="documentos.html">${t('common:participate.inform.documents')}</a>
            <a class="button button--ghost" href="mapa.html">${t('common:participate.inform.map')}</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const feedback = mount.querySelector<HTMLElement>('.participate-feedback');
  mount.querySelector('[data-action="share"]')?.addEventListener('click', () => {
    void shareLink(shareUrl ?? window.location.href.split('#')[0], feedback);
  });
};
