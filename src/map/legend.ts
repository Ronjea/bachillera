import { t } from '../i18n';
import { TYPOLOGY_META, TYPOLOGY_ORDER, VOLTAGE_COLORS } from './typology';

/** Renders the floating map legend: voltage typology dots, the heatmap
 *  swatch, and the power lines section (solid = overhead, dashed =
 *  underground, plus the "unspecified voltage" dot). Static content, so it
 *  only needs to render once. */
export const renderMapLegend = (): void => {
  const legend = document.querySelector<HTMLDivElement>('#mapLegend');
  if (!legend) return;

  const typologyRows = TYPOLOGY_ORDER.map((key) => {
    const meta = TYPOLOGY_META[key];
    return `<div class="legend-row"><span class="dot" style="background:${meta.color}"></span>${t(meta.labelKey)}</div>`;
  }).join('');

  legend.innerHTML = `
    <div class="legend-title">${t('map:legend.title')}</div>
    ${typologyRows}
    <div class="legend-row" style="margin-top:6px;">
      <span class="dot" style="background:var(--color-primary);opacity:.6"></span>${t('map:legend.heatmap')}
    </div>
    <div class="legend-title" style="margin-top:10px;">${t('map:legend.linesTitle')}</div>
    <div class="legend-row"><span class="legend-line"></span>${t('map:legend.linesOverhead')}</div>
    <div class="legend-row"><span class="legend-line dashed"></span>${t('map:legend.linesUnderground')}</div>
    <div class="legend-row"><span class="dot" style="background:${VOLTAGE_COLORS.unknown}"></span>${t('map:legend.linesUnspecified')}</div>
  `;
};
