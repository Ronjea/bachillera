import type { LngLat, Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl';
import { Popup } from 'maplibre-gl';
import { t } from '../i18n';
import type { PowerLineKind, SubstationTypology, VoltageClass } from '../shared/types';
import { parseVoltageLevels } from './data';
import { isPowerLineKind, isSubstationTypology, isVoltageClass, TYPOLOGY_META, VOLTAGE_COLORS } from './typology';

const asString = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const asNumber = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

type SubstationPopupData = {
  name: string;
  municipality: string;
  maxVoltageKv: number;
  voltageLevelsKv: number[];
  typology: SubstationTypology;
};

/** Reads a rendered map feature's properties defensively: MapLibre types
 *  feature properties as an untyped bag, and array-typed fields (like
 *  voltageLevelsKv) can arrive JSON-stringified once round-tripped through a
 *  rendered feature (see parseVoltageLevels). Returns null if the typology
 *  is missing/invalid, since that is the one field the popup cannot do
 *  without. */
const readSubstationPopupData = (properties: Record<string, unknown>): SubstationPopupData | null => {
  if (!isSubstationTypology(properties.typology)) return null;
  return {
    name: asString(properties.name) ?? '',
    municipality: asString(properties.municipality) ?? '',
    maxVoltageKv: asNumber(properties.maxVoltageKv) ?? 0,
    voltageLevelsKv: parseVoltageLevels(properties.voltageLevelsKv),
    typology: properties.typology,
  };
};

type PowerLinePopupData = {
  name: string | null;
  kind: PowerLineKind;
  voltageClass: VoltageClass;
  voltageKv: number | null;
  circuits: number | null;
  cables: string | null;
};

const readPowerLinePopupData = (properties: Record<string, unknown>): PowerLinePopupData | null => {
  if (!isPowerLineKind(properties.kind)) return null;
  return {
    name: asString(properties.name),
    kind: properties.kind,
    voltageClass: isVoltageClass(properties.voltageClass) ? properties.voltageClass : 'unknown',
    voltageKv: asNumber(properties.voltageKv),
    circuits: asNumber(properties.circuits),
    cables: asString(properties.cables),
  };
};

const popupRow = (label: string, value: string): string =>
  `<div class="popup-row"><span>${label}</span><span>${value}</span></div>`;

const popupNoteRow = (label: string, note: string): string => `
  <div class="popup-row popup-row--note">
    <span style="color:var(--color-text-muted)">${label}</span>
    <span style="font-family:var(--font-body); text-align:left; font-weight:400; color:var(--color-text-muted); font-size:0.68rem;">${note}</span>
  </div>
`;

/** Shows the substation popup anchored at the marker's own coordinates,
 *  matching legacy behavior (as opposed to the click location). Returns
 *  silently if the feature's geometry isn't a Point or its typology is
 *  unreadable — both should be impossible given our own generated data. */
export const showSubstationPopup = (map: MapLibreMap, feature: MapGeoJSONFeature): void => {
  if (feature.geometry.type !== 'Point') return;
  const data = readSubstationPopupData(feature.properties);
  if (!data) return;

  const meta = TYPOLOGY_META[data.typology];
  const levels = data.voltageLevelsKv.length > 0 ? data.voltageLevelsKv.join(' / ') : t('map:popup.levelsUnknown');

  const html = `
    <div class="popup-title">${data.name}</div>
    <div class="popup-muni">${t('map:popup.provinceOf', { municipality: data.municipality })}</div>
    <span class="popup-badge" style="background:${meta.color}22; color:${meta.color}">${t(meta.labelKey)}</span>
    ${popupRow(t('map:popup.maxVoltage'), `${data.maxVoltageKv} kV`)}
    ${popupRow(t('map:popup.availableLevels'), `${levels} kV`)}
    ${popupRow(t('map:popup.typology'), t(meta.subKey))}
    ${popupNoteRow(t('map:popup.capacity'), t(meta.capacityNoteKey))}
    ${popupNoteRow(t('map:popup.urbanism'), t(meta.urbanismNoteKey))}
  `;

  // Justified assertion: geometry is confirmed Point above, so `coordinates`
  // is a 2-length [lon, lat] Position by construction of our own generated
  // GeoJSON; the geojson package only widens it to `number[]`.
  new Popup({ closeButton: true, maxWidth: '300px' })
    .setLngLat(feature.geometry.coordinates as [number, number])
    .setHTML(html)
    .addTo(map);
};

/** Shows a power line popup anchored at the click location (lines have no
 *  single natural anchor point the way a substation marker does). */
export const showPowerLinePopup = (map: MapLibreMap, lngLat: LngLat, feature: MapGeoJSONFeature): void => {
  const data = readPowerLinePopupData(feature.properties);
  if (!data) return;

  const color = VOLTAGE_COLORS[data.voltageClass];
  const title = data.name ?? t('map:linePopup.unnamed');
  const kindLabel = t(`map:linePopup.kind.${data.kind}`);
  const voltageValue = data.voltageKv !== null ? `${data.voltageKv} kV` : t('map:linePopup.voltageUnknown');

  const rows = [popupRow(t('map:linePopup.voltage'), voltageValue)];
  if (data.circuits !== null) rows.push(popupRow(t('map:linePopup.circuits'), String(data.circuits)));
  if (data.cables !== null) rows.push(popupRow(t('map:linePopup.cables'), data.cables));

  const legalNoteKey = data.kind === 'overhead' ? 'legal:popup.overheadNote' : 'legal:popup.undergroundNote';

  const html = `
    <div class="popup-title">${title}</div>
    <span class="popup-badge" style="background:${color}22; color:${color}">${kindLabel}</span>
    ${rows.join('')}
    ${popupNoteRow(t('map:linePopup.legal'), t(legalNoteKey))}
    <div class="popup-footnote">${t('map:linePopup.attribution')}</div>
  `;

  new Popup({ closeButton: true, maxWidth: '300px' }).setLngLat(lngLat).setHTML(html).addTo(map);
};
