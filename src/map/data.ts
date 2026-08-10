import type { Substation, SubstationTypology } from '../shared/types';
import type { PowerLinesCollection, PowerLinesState } from './state';

/** Shape of the legacy Spanish-keyed records in public/data/substations.json. */
type RawSubstation = {
  id: number;
  nombre: string;
  municipio: string;
  provincia: string;
  lat: number;
  lon: number;
  tension_max_kV: number;
  /** Normally an array, but parsed defensively: MapLibre re-serializes
   *  array-typed feature properties as JSON strings once they round-trip
   *  through a rendered map feature (see parseVoltageLevels below, reused
   *  by popup.ts for that exact case). */
  niveles_tension_kV: unknown;
  tipologia: 'alta' | 'media' | 'baja';
};

const TYPOLOGY_BY_RAW_KEY: Record<RawSubstation['tipologia'], SubstationTypology> = {
  alta: 'high',
  media: 'medium',
  baja: 'low',
};

/** Defensively parses a voltage-level list that may arrive as a real array
 *  (fresh fetch of substations.json) or as a string (a JSON-stringified array,
 *  or a "[220, 132]"-like literal), matching the legacy app's defensive
 *  parsing in showPopup(). */
export const parseVoltageLevels = (raw: unknown): number[] => {
  if (Array.isArray(raw)) {
    return raw.map(Number).filter((value) => Number.isFinite(value));
  }
  if (typeof raw !== 'string') return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(Number).filter((value) => Number.isFinite(value));
    }
  } catch {
    // Not JSON — fall through to comma-separated parsing below.
  }
  return raw
    .replace(/[[\]]/g, '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value));
};

const mapSubstation = (raw: RawSubstation): Substation => ({
  id: raw.id,
  name: raw.nombre,
  municipality: raw.municipio,
  province: raw.provincia,
  lat: raw.lat,
  lon: raw.lon,
  maxVoltageKv: raw.tension_max_kV,
  voltageLevelsKv: parseVoltageLevels(raw.niveles_tension_kV),
  typology: TYPOLOGY_BY_RAW_KEY[raw.tipologia],
});

export const fetchSubstations = async (): Promise<Substation[]> => {
  const response = await fetch('data/substations.json');
  if (!response.ok) {
    throw new Error(`Failed to load substations.json: HTTP ${response.status}`);
  }
  // Justified assertion: external JSON boundary. The mapper above only reads
  // the documented fields (reference/handover.md section 4) and is defensive
  // about the one field known to vary in shape.
  const raw = (await response.json()) as RawSubstation[];
  return raw.map(mapSubstation);
};

const PRIMARY_POWER_LINES_URL = 'data/power-lines.geojson';
const FIXTURE_POWER_LINES_URL = 'data/_fixtures/power-lines-sample.geojson';

const fetchPowerLinesCollection = async (url: string): Promise<PowerLinesCollection | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    // Justified assertion: external GeoJSON boundary. Shape is the documented
    // PowerLineProperties contract in shared/types.ts; consumers (layers.ts,
    // popup.ts) re-validate individual fields defensively before use.
    return (await response.json()) as PowerLinesCollection;
  } catch {
    return null;
  }
};

/** Loads the power lines layer data with graceful degradation: the real
 *  dataset first, then the fixture if it 404s (data worker not done yet),
 *  then null if neither is available (layer stays off, toggles disabled). */
export const fetchPowerLines = async (): Promise<PowerLinesState | null> => {
  const primary = await fetchPowerLinesCollection(PRIMARY_POWER_LINES_URL);
  if (primary) return { collection: primary, usingFixture: false };

  const fixture = await fetchPowerLinesCollection(FIXTURE_POWER_LINES_URL);
  if (fixture) return { collection: fixture, usingFixture: true };

  return null;
};
