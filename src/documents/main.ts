import { initI18n, translateDom, currentLocale, onLocaleChange } from '../i18n';
import { initSiteNav } from '../shared/nav';

/**
 * The archive is Spanish-only source material. When the visitor's active
 * locale is English, show a discreet note under the nav explaining that;
 * hide it for Spanish. The note lives purely in the DOM (no markup in
 * documentos.html) so the archive's own content stays untouched.
 */
const setupLanguageNote = (): void => {
  const nav = document.getElementById('siteNav');
  if (!nav) return;

  const note = document.createElement('p');
  note.id = 'documentsLangNote';
  note.className = 'lang-note';
  note.setAttribute('data-i18n', 'common:documentsSpanishNote');
  nav.insertAdjacentElement('afterend', note);

  const syncVisibility = (): void => {
    note.hidden = currentLocale() !== 'en';
  };
  syncVisibility();
  onLocaleChange(syncVisibility);
};

// The archive page keeps its own fixed "paper" aesthetic: no theme handling.
const init = async (): Promise<void> => {
  await initI18n();
  initSiteNav({ current: 'documents', skin: 'paper' });
  setupLanguageNote();
  translateDom();
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
