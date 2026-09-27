import '../styles/tokens.css';
import '../styles/components.css';
import '../styles/documents.css';
import { initI18n, t, translateDom } from '../i18n';
import { initSiteNav } from '../shared/nav';
import { renderParticipate } from '../shared/participate';
import esDocuments from '../i18n/locales/es/documents.json';
import { searchDocuments } from './search';
import { catalog, documentsByTopic, featuredDocuments, TOPIC_ORDER, type ArchiveDocument, type DocumentTopic } from './catalog';

const EXTERNAL_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>';

/** Movements-eligible topics also double as movimientos.html section ids. */
const MOVEMENT_TOPICS: readonly DocumentTopic[] = ['lineas', 'calles', 'vivienda'];

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const renderDocCard = (doc: ArchiveDocument): string => `
  <article class="doc-card${doc.featured ? ' doc-card--featured' : ''}">
    <a class="doc-card-link" href="${escapeHtml(doc.href)}" target="_blank" rel="noopener" data-testid="doc-${doc.id}">
      <span class="doc-card-head">
        <span class="doc-card-kind doc-card-kind--${doc.kind}">${t(`documents:kinds.${doc.kind}`)}</span>
        ${doc.date ? `<span class="doc-card-date">${escapeHtml(doc.date)}</span>` : ''}
      </span>
      <h3 class="doc-card-title">${escapeHtml(doc.title)}</h3>
      ${doc.subtitle ? `<p class="doc-card-subtitle">${escapeHtml(doc.subtitle)}</p>` : ''}
      <p class="doc-card-desc">${escapeHtml(doc.description)}</p>
      <span class="doc-card-cta">${EXTERNAL_ICON}<span>${doc.isPdf ? t('documents:card.openPdf') : t('documents:card.open')}</span></span>
      <span class="doc-card-source">${escapeHtml(doc.sourceLabel)}</span>
    </a>
  </article>`;

const renderGuideCard = (): string => `
  <article class="doc-card doc-card--featured">
    <a class="doc-card-link" href="guia-peri.html" data-testid="doc-guia-peri">
      <span class="doc-card-head"><span class="doc-card-kind">${t('documents:featured.guideCard.kind')}</span></span>
      <h3 class="doc-card-title">${t('documents:featured.guideCard.title')}</h3>
      <p class="doc-card-desc">${t('documents:featured.guideCard.description')}</p>
      <span class="doc-card-cta">${EXTERNAL_ICON}<span>${t('documents:featured.guideCard.cta')}</span></span>
    </a>
  </article>`;

const renderFeatured = (): void => {
  const mount = document.getElementById('featuredGrid');
  if (!mount) return;
  mount.innerHTML = featuredDocuments().map(renderDocCard).join('') + renderGuideCard();
};

/** The chips' topic order and counts never change with the current
 *  filter: they reflect the whole catalog, so the list stays scannable. */
const renderChips = (): void => {
  const mount = document.getElementById('topicChipsInner');
  if (!mount) return;

  const chips = [
    { id: 'todos', label: t('documents:chips.todos'), count: catalog.length },
    ...TOPIC_ORDER.map((topic) => ({ id: topic, label: t(`documents:chips.${topic}`), count: documentsByTopic(topic).length })),
  ];

  mount.innerHTML = chips
    .map(
      (chip) => `
      <a class="topic-chip" href="#${chip.id === 'todos' ? '' : chip.id}" data-topic="${chip.id}" data-testid="chip-${chip.id}">
        <span>${chip.label}</span><span class="topic-chip-count">${chip.count}</span>
      </a>`,
    )
    .join('');
};

const highlightActiveChip = (activeTopic: string): void => {
  document.querySelectorAll<HTMLAnchorElement>('.topic-chip').forEach((chip) => {
    chip.classList.toggle('topic-chip--active', chip.dataset.topic === activeTopic);
  });
};

const getActiveTopic = (): DocumentTopic | 'todos' => {
  const hash = window.location.hash.replace('#', '');
  return (TOPIC_ORDER as readonly string[]).includes(hash) ? (hash as DocumentTopic) : 'todos';
};

const renderMovementLink = (topic: DocumentTopic): string => {
  if (!MOVEMENT_TOPICS.includes(topic)) return '';
  const label = t(`documents:topics.${topic}.movementLabel`);
  return `<a class="movement-link" href="movimientos.html#${topic}">${t('documents:movementLink', { title: label })}</a>`;
};

const renderDocList = (docs: ArchiveDocument[]): string =>
  docs.length
    ? `<div class="doc-list">${docs.map(renderDocCard).join('')}</div>`
    : `<p class="doc-empty">${t('documents:empty')}</p>`;

/** "Todos" is an index of topics rather than every card at once: 30+ cards
 *  in a row is too long to scan on a phone. Each card opens its topic. */
const renderTodos = (): string => `
  <div class="topic-index">
    ${TOPIC_ORDER.map((topic) => {
      const count = documentsByTopic(topic).length;
      if (!count) return '';
      return `
      <a class="topic-index-card" href="#${topic}" data-testid="topic-card-${topic}">
        <span class="topic-index-head">
          <span class="topic-index-title">${t(`documents:chips.${topic}`)}</span>
          <span class="topic-chip-count">${count}</span>
        </span>
        <span class="topic-index-desc">${t(`documents:topics.${topic}.explanation`)}</span>
        <span class="topic-index-cta">${t('documents:topicIndex.cta')}</span>
      </a>`;
    }).join('')}
  </div>`;

const renderFiltered = (topic: DocumentTopic): string => `
  <div class="topic-group">
    <div class="topic-group-head">
      <h2 class="topic-group-title">${t(`documents:chips.${topic}`)}</h2>
    </div>
    <p class="topic-explanation">${t(`documents:topics.${topic}.explanation`)}</p>
    ${renderMovementLink(topic)}
    ${renderDocList(documentsByTopic(topic))}
  </div>`;

const getQuery = (): string => new URLSearchParams(window.location.search).get('q')?.trim() ?? '';

/** Keeps the query in `?q=` (shareable, survives reload) without adding a
 *  history entry per keystroke. */
const setQuery = (query: string): void => {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  window.history.replaceState(null, '', url);
};

const renderSearchResults = (query: string): string => {
  const results = searchDocuments(catalog, query);
  const safeQuery = escapeHtml(query);
  if (!results.length) {
    return `
      <div class="search-results">
        <p class="doc-empty" data-testid="search-empty">${t('documents:search.empty', { query: safeQuery })}</p>
        <a class="button button--ghost" href="#" data-action="clear-search">${t('documents:search.showTopics')}</a>
      </div>`;
  }
  return `
    <div class="search-results">
      <p class="search-count" role="status" data-testid="search-count">${t('documents:search.results', { count: results.length, query: safeQuery })}</p>
      ${renderDocList(results)}
    </div>`;
};

const renderList = (): void => {
  const mount = document.getElementById('documentsList');
  if (!mount) return;
  const query = getQuery();
  const activeTopic = getActiveTopic();

  // A search looks through the whole catalog, so no topic chip is active.
  if (query) {
    mount.innerHTML = renderSearchResults(query);
    highlightActiveChip('');
  } else {
    mount.innerHTML = activeTopic === 'todos' ? renderTodos() : renderFiltered(activeTopic);
    highlightActiveChip(activeTopic);
  }

  // Featured documents only make sense on the overview; inside a topic or a
  // search they would push the relevant documents a whole screen down.
  const featured = document.getElementById('destacados');
  if (featured) featured.hidden = Boolean(query) || activeTopic !== 'todos';
};

const initSearch = (): void => {
  const form = document.getElementById('docSearch');
  const input = document.querySelector<HTMLInputElement>('#docSearchInput');
  const clear = document.querySelector<HTMLButtonElement>('#docSearchClear');
  if (!form || !input || !clear) return;

  const apply = (query: string): void => {
    setQuery(query);
    clear.hidden = !query;
    renderList();
  };

  input.value = getQuery();
  clear.hidden = !input.value;

  input.addEventListener('input', () => apply(input.value.trim()));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Closes the phone keyboard so the results are visible.
    input.blur();
    document.getElementById('documentos')?.scrollIntoView({ block: 'start' });
  });
  clear.addEventListener('click', () => {
    input.value = '';
    apply('');
    input.focus();
  });

  // Picking a topic (chip, topic card or "Ver todos los temas") ends the search.
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('.topic-chip, .topic-index-card, [data-action="clear-search"]') : null;
    if (!target || !getQuery()) return;
    input.value = '';
    setQuery('');
    clear.hidden = true;
    if (target.matches('[data-action="clear-search"]')) event.preventDefault();
    // Same-hash clicks fire no hashchange, so render explicitly.
    renderList();
  });
};

/** On a topic change, bring the list (not the page top) into view. */
const onHashChange = (): void => {
  renderList();
  document.getElementById('documentos')?.scrollIntoView({ block: 'start' });
};

const init = async (): Promise<void> => {
  await initI18n([{ locale: 'es', namespace: 'documents', resources: esDocuments }]);
  initSiteNav({ current: 'documents' });
  translateDom();

  renderFeatured();
  renderChips();
  initSearch();
  renderList();
  renderParticipate({ mountId: 'participa' });

  window.addEventListener('hashchange', onHashChange);
};

document.addEventListener('DOMContentLoaded', () => {
  void init();
});
