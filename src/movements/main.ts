import '../styles/tokens.css';
import '../styles/components.css';
import '../styles/movements.css';
import { initI18n, t, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';
import { renderParticipate, shareLink } from '../shared/participate';
import { CONTACT_EMAIL } from '../shared/contact';
import esMovements from '../i18n/locales/es/movements.json';
import esLegal from '../i18n/locales/es/legal.json';
import esMap from '../i18n/locales/es/map.json';
import { renderMapLegend } from './map-legend';

type Fact = { value: string; label: string; variant: string };
type TimelineItem = { year: string; text: string };
type Source = { label: string; href: string };
type Movement = {
  demands: string[];
  timeline: TimelineItem[];
  sources: Source[];
  cta: string;
  ctaHref: string;
  title: string;
  facts?: Fact[];
};

const SHARE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>';
const MAIL_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';

const MOVEMENT_IDS = ['lineas', 'calles', 'vivienda'] as const;
type MovementId = (typeof MOVEMENT_IDS)[number];

const movementData: Record<MovementId, Movement> = {
  lineas: esMovements.lineas,
  calles: esMovements.calles,
  vivienda: esMovements.vivienda,
};

const renderFacts = (containerId: string, facts: Fact[] | undefined): void => {
  const mount = document.getElementById(containerId);
  if (!mount || !facts) return;
  mount.innerHTML = facts
    .map(
      (fact) => `
        <div class="fact-card fact-card--${fact.variant}">
          <span class="fact-value">${fact.value}</span>
          <span class="fact-label">${fact.label}</span>
        </div>
      `,
    )
    .join('');
};

const renderDemands = (containerId: string, items: string[]): void => {
  const mount = document.getElementById(containerId);
  if (!mount) return;
  mount.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
};

const renderTimeline = (containerId: string, items: TimelineItem[]): void => {
  const mount = document.getElementById(containerId);
  if (!mount) return;
  mount.innerHTML = items
    .map(
      (item) => `
        <li class="timeline-item">
          <span class="timeline-year">${item.year}</span>
          <p class="timeline-text">${item.text}</p>
        </li>
      `,
    )
    .join('');
};

const renderSources = (containerId: string, items: Source[]): void => {
  const mount = document.getElementById(containerId);
  if (!mount) return;
  mount.innerHTML = items
    .map((item) => {
      const isExternal = /^https?:\/\//.test(item.href);
      const attrs = isExternal ? ' target="_blank" rel="noopener"' : '';
      return `<li><a href="${item.href}"${attrs}>${item.label}</a></li>`;
    })
    .join('');
};

const shareUrlFor = (movementId: MovementId): string =>
  new URL(`#${movementId}`, window.location.href.split('#')[0]).href;

const renderActions = (containerId: string, movementId: MovementId, movement: Movement): void => {
  const mount = document.getElementById(containerId);
  if (!mount) return;

  const emailAction = CONTACT_EMAIL
    ? `<a class="button button--ghost" href="mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        `${t('movements:actions.emailSubject')}${movement.title}`,
      )}" data-testid="email-${movementId}">${MAIL_ICON}${t('movements:actions.email')}</a>`
    : '';

  mount.innerHTML = `
    <div class="button-row">
      <button type="button" class="button button--primary" data-action="share" data-testid="share-${movementId}">${SHARE_ICON}${t('movements:actions.share')}</button>
      <a class="button button--ghost" href="${movement.ctaHref}">${movement.cta}</a>
      ${emailAction}
    </div>
    <p class="participate-feedback" role="status" aria-live="polite"></p>
  `;

  const feedback = mount.querySelector<HTMLElement>('.participate-feedback');
  mount.querySelector('[data-action="share"]')?.addEventListener('click', () => {
    void shareLink(shareUrlFor(movementId), feedback);
  });
};

const renderMovement = (movementId: MovementId): void => {
  const movement = movementData[movementId];

  if (movement.facts) renderFacts(`${movementId}Facts`, movement.facts);
  renderDemands(`${movementId}Demands`, movement.demands);
  renderTimeline(`${movementId}Timeline`, movement.timeline);
  renderSources(`${movementId}Sources`, movement.sources);
  renderActions(`${movementId}Actions`, movementId, movement);
};

/** Highlights the jump chip of the movement currently in view. */
const initChipHighlight = (): void => {
  const chips = document.querySelectorAll<HTMLAnchorElement>('.jump-chip');
  if (!chips.length || !('IntersectionObserver' in window)) return;

  const chipFor = (id: string): HTMLAnchorElement | undefined =>
    Array.from(chips).find((chip) => chip.dataset.jump === id);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const chip = chipFor(entry.target.id);
        if (!chip) return;
        chips.forEach((c) => c.classList.remove('jump-chip--active'));
        chip.classList.add('jump-chip--active');
      });
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );

  MOVEMENT_IDS.forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
};

const init = async (): Promise<void> => {
  await initI18n([
    { locale: 'es', namespace: 'movements', resources: esMovements },
    { locale: 'es', namespace: 'legal', resources: esLegal },
    { locale: 'es', namespace: 'map', resources: esMap },
  ]);
  initSiteNav({ current: 'movements' });
  translateDom();

  MOVEMENT_IDS.forEach(renderMovement);
  renderParticipate({ mountId: 'participa' });
  renderMapLegend();
  initChipHighlight();
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
