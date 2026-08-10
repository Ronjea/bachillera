import type { FeatureCollection, Geometry, LineString, Point } from 'geojson';
import type { PowerLineProperties, Substation, SubstationTypology } from '../shared/types';

export type PowerLinesCollection = FeatureCollection<LineString, PowerLineProperties>;
export type PowerLinesState = { collection: PowerLinesCollection; usingFixture: boolean };
export type RouteCollection = FeatureCollection<LineString>;
export type UserPointCollection = FeatureCollection<Point>;

export const emptyFeatureCollection = <T extends Geometry>(): FeatureCollection<T> => ({
  type: 'FeatureCollection',
  features: [],
});

/** Convenience constructors so callers never need to reach for the `geojson`
 *  package types themselves — they just want "no data yet" placeholders. */
export const emptyPowerLinesCollection = (): PowerLinesCollection => emptyFeatureCollection<LineString>();
export const emptyRouteCollection = (): RouteCollection => emptyFeatureCollection<LineString>();
export const emptyUserPointCollection = (): UserPointCollection => emptyFeatureCollection<Point>();

let allSubstations: Substation[] = [];
let activeTypologies = new Set<SubstationTypology>(['high', 'medium', 'low']);
let activeMunicipality = '';
let routeData: RouteCollection | null = null;
let userPointData: UserPointCollection | null = null;
let powerLines: PowerLinesState | null = null;

export const getAllSubstations = (): readonly Substation[] => allSubstations;
export const setAllSubstations = (list: Substation[]): void => {
  allSubstations = list;
};

export const getActiveTypologies = (): ReadonlySet<SubstationTypology> => activeTypologies;

/** Toggles one typology on/off, refusing to deactivate the last active one
 *  (parity with the legacy "keep at least one active" rule). Returns whether
 *  the toggle was applied. */
export const toggleTypology = (key: SubstationTypology): boolean => {
  const next = new Set(activeTypologies);
  if (next.has(key)) {
    if (next.size === 1) return false;
    next.delete(key);
  } else {
    next.add(key);
  }
  activeTypologies = next;
  return true;
};

export const getActiveMunicipality = (): string => activeMunicipality;
export const setActiveMunicipality = (value: string): void => {
  activeMunicipality = value;
};

/** Route + user-location data survive a map style switch (setStyle wipes all
 *  sources), so they are kept here and redrawn by layers.ts::addDataLayers. */
export const getRouteData = (): RouteCollection | null => routeData;
export const setRouteData = (data: RouteCollection): void => {
  routeData = data;
};

export const getUserPointData = (): UserPointCollection | null => userPointData;
export const setUserPointData = (data: UserPointCollection): void => {
  userPointData = data;
};

export const getPowerLines = (): PowerLinesState | null => powerLines;
export const setPowerLines = (data: PowerLinesState | null): void => {
  powerLines = data;
};
