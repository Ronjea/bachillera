import { t } from '../i18n';
import { TYPOLOGY_META, TYPOLOGY_ORDER } from '../map/typology';

/** Legend under the map preview card, built from the same palette and
 *  labels as the full map so both read identically. */
export const renderMapLegend = (): void => {
  const mount = document.getElementById('linesMapLegend');
  if (!mount) return;
  const voltages = TYPOLOGY_ORDER.map((typology) => {
    const meta = TYPOLOGY_META[typology];
    return `<li><span class="legend-swatch" style="background:${meta.color}"></span>${t(meta.labelKey)} <small>${t(meta.subKey)}</small></li>`;
  });
  const kinds = [
    `<li><span class="legend-line"></span>${t('map:legend.linesOverhead')}</li>`,
    `<li><span class="legend-line legend-line--dashed"></span>${t('map:legend.linesUnderground')}</li>`,
  ];
  mount.innerHTML = [...voltages, ...kinds].join('');
};
