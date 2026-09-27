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

/** Thematic groups used to organise the photo gallery of memoria.html. */
export type MemoryGroup = 'origins' | 'daily-life' | 'celebrations' | 'sport' | 'community' | 'urbanism';

/** A curated archive photo. Files live in public/images/memoria/{id}.jpg and
 *  {id}-thumb.jpg (see scripts/fetch-memory-photos.mjs). Licensed CC BY-NC-ND,
 *  so images are only resized, never cropped or edited. */
export type MemoryPhoto = {
  id: string;
  title: string;
  date: string;
  group: MemoryGroup;
  credit: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  alt: string;
  width: number | null;
  height: number | null;
};

/** An archive.org film embedded through https://archive.org/embed/{archiveId}. */
export type MemoryVideo = {
  id: string;
  archiveId: string;
  title: string;
  date: string;
  description: string;
  license: string;
  sourceUrl: string;
};

export type BeforeAfterImage = {
  title: string;
  date: string;
  credit: string;
  sourceUrl: string;
};

/** Rephotography pair; image files are {id}-before.jpg and {id}-after.jpg. */
export type BeforeAfterPair = {
  id: string;
  title: string;
  place: string;
  before: BeforeAfterImage;
  after: BeforeAfterImage;
};

export type PressReportKind = 'prensa' | 'revista' | 'institucional' | 'blog' | 'archivo';

export type PressReport = {
  id: string;
  outlet: string;
  date: string;
  title: string;
  summary: string;
  url: string;
  kind: PressReportKind;
};

export type MemoryCatalog = {
  photos: MemoryPhoto[];
  videos: MemoryVideo[];
  beforeAfter: BeforeAfterPair[];
  reports: PressReport[];
};
