import type { Map as MapLibreMap } from 'maplibre-gl';
import { t } from '../i18n';
import { CASING_LAYER_ID, OVERHEAD_LAYER_ID, UNDERGROUND_LAYER_ID } from './power-line-layers';

const setLayerVisible = (map: MapLibreMap, layerId: string, visible: boolean): void => {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
};

/** Wires the "capas visuales" checkboxes: markers/heatmap/clusters (markers
 *  and clusters are mutually exclusive, matching the legacy app), plus the
 *  power lines master toggle and its two overhead/underground sub-toggles. */
export const initLayerToggles = (map: MapLibreMap): void => {
  const markers = document.querySelector<HTMLInputElement>('#layerMarkers');
  const heatmap = document.querySelector<HTMLInputElement>('#layerHeatmap');
  const clusters = document.querySelector<HTMLInputElement>('#layerClusters');
  const lines = document.querySelector<HTMLInputElement>('#layerLines');
  const linesOverhead = document.querySelector<HTMLInputElement>('#layerLinesOverhead');
  const linesUnderground = document.querySelector<HTMLInputElement>('#layerLinesUnderground');
  const subToggleRow = document.querySelector<HTMLElement>('#lineSubToggles');
  if (!markers || !heatmap || !clusters || !lines || !linesOverhead || !linesUnderground) return;

  markers.addEventListener('change', () => setLayerVisible(map, 'substation-circles', markers.checked));
  heatmap.addEventListener('change', () => setLayerVisible(map, 'heat-layer', heatmap.checked));
  clusters.addEventListener('change', () => {
    setLayerVisible(map, 'cluster-circles', clusters.checked);
    setLayerVisible(map, 'cluster-labels', clusters.checked);
    if (clusters.checked) {
      markers.checked = false;
      setLayerVisible(map, 'substation-circles', false);
    } else {
      markers.checked = true;
      setLayerVisible(map, 'substation-circles', true);
    }
  });

  const setSubToggleAvailability = (available: boolean): void => {
    subToggleRow?.classList.toggle('disabled', !available);
    linesOverhead.disabled = !available;
    linesUnderground.disabled = !available;
  };
  const setMiniChipInactive = (checkbox: HTMLInputElement): void => {
    checkbox.closest('.filter-chip.mini')?.classList.toggle('inactive', !checkbox.checked);
  };

  lines.addEventListener('change', () => {
    setLayerVisible(map, CASING_LAYER_ID, lines.checked);
    setLayerVisible(map, OVERHEAD_LAYER_ID, lines.checked && linesOverhead.checked);
    setLayerVisible(map, UNDERGROUND_LAYER_ID, lines.checked && linesUnderground.checked);
    setSubToggleAvailability(lines.checked);
  });
  linesOverhead.addEventListener('change', () => {
    setLayerVisible(map, OVERHEAD_LAYER_ID, linesOverhead.checked);
    setMiniChipInactive(linesOverhead);
  });
  linesUnderground.addEventListener('change', () => {
    setLayerVisible(map, UNDERGROUND_LAYER_ID, linesUnderground.checked);
    setMiniChipInactive(linesUnderground);
  });

  setSubToggleAvailability(lines.checked);
  setMiniChipInactive(linesOverhead);
  setMiniChipInactive(linesUnderground);
};

/** Called when the power lines dataset could not be loaded at all (neither
 *  the real file nor the fixture): forces the master + sub toggles off and
 *  disabled, and reveals the i18n warning note under them. The map still
 *  works — it just never gets a `power-lines` layer with any data in it. */
export const disablePowerLineControls = (): void => {
  const lines = document.querySelector<HTMLInputElement>('#layerLines');
  const linesOverhead = document.querySelector<HTMLInputElement>('#layerLinesOverhead');
  const linesUnderground = document.querySelector<HTMLInputElement>('#layerLinesUnderground');
  const subToggleRow = document.querySelector<HTMLElement>('#lineSubToggles');
  const warning = document.querySelector<HTMLElement>('#powerLinesWarning');

  [lines, linesOverhead, linesUnderground].forEach((checkbox) => {
    if (!checkbox) return;
    checkbox.checked = false;
    checkbox.disabled = true;
    checkbox.closest('.filter-chip.mini')?.classList.add('inactive');
  });
  subToggleRow?.classList.add('disabled');
  if (warning) {
    warning.textContent = t('map:layers.dataUnavailable');
    warning.hidden = false;
  }
};
