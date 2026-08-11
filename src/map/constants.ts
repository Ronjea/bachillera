/** Single basemap style — the site has no dark mode, so there is no style
 *  to switch to and no theme wiring anywhere in this module tree. Note: no
 *  trailing /style.json — OpenFreeMap serves the style JSON directly here. */
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

/** Bounding boxes for view presets, [west, south, east, north]. */
export const BBOX_METRO: [number, number, number, number] = [-6.15, 37.18, -5.6, 37.62];
export const BBOX_PROVINCE: [number, number, number, number] = [-6.55, 36.9, -4.68, 38.2];
export const BBOX_BACHILLERA: [number, number, number, number] = [-6.0, 37.402, -5.972, 37.433];
