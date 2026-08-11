import { t } from '../i18n';
import { getAllSubstations } from './state';
import { countByTypology, TYPOLOGY_META, TYPOLOGY_ORDER } from './typology';

/** Renders the summary stat cards: total substations, distinct
 *  municipalities, and one card per typology with its live count. Call
 *  once after substations are loaded — the counts are against the full
 *  dataset and do not change as filters are applied. */
export const renderStats = (): void => {
  const grid = document.querySelector<HTMLDivElement>('#statGrid');
  if (!grid) return;

  const all = getAllSubstations();
  const municipalityCount = new Set(all.map((substation) => substation.municipality)).size;
  const counts = countByTypology(all);

  const typologyCards = TYPOLOGY_ORDER.map((key) => {
    const meta = TYPOLOGY_META[key];
    return `
      <div class="stat-card dot" style="--dot-color:${meta.color}" data-testid="stat-${key}">
        <div class="stat-value" style="color:${meta.color}">${counts[key]}</div>
        <div class="stat-label">${t(meta.labelKey)}</div>
      </div>
    `;
  }).join('');

  grid.innerHTML = `
    <div class="stat-card" data-testid="stat-total">
      <div class="stat-value">${all.length}</div>
      <div class="stat-label">${t('map:stats.total')}</div>
    </div>
    <div class="stat-card" data-testid="stat-municipalities">
      <div class="stat-value">${municipalityCount}</div>
      <div class="stat-label">${t('map:stats.municipalities')}</div>
    </div>
    ${typologyCards}
  `;
};
