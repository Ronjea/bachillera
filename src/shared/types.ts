/** Voltage tiers shared by substations and power lines. Aligned with the
 *  legacy dataset: high = 220/400 kV (transmission), medium = 132 kV
 *  (HV distribution), low = ≤66 kV (local distribution). */
export type VoltageClass = 'high' | 'medium' | 'low' | 'unknown';

export type SubstationTypology = Exclude<VoltageClass, 'unknown'>;

/** Substation record after mapping the legacy Spanish-keyed JSON. */
export type Substation = {
  id: number;
  name: string;
  municipality: string;
  province: string;
  lat: number;
  lon: number;
  maxVoltageKv: number;
  voltageLevelsKv: number[];
  typology: SubstationTypology;
};

export type PowerLineKind = 'overhead' | 'underground';

/** GeoJSON feature properties contract for public/data/power-lines.geojson. */
export type PowerLineProperties = {
  id: string;
  kind: PowerLineKind;
  voltageClass: VoltageClass;
  voltageKv: number | null;
  name: string | null;
  circuits: number | null;
  cables: string | null;
  source: 'osm';
};
