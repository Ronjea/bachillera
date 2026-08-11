import type { Map as MapLibreMap } from 'maplibre-gl';
import { BBOX_BACHILLERA, BBOX_METRO, BBOX_PROVINCE } from './constants';

/** Wires the three view-preset chips (metro / full province / La Bachillera)
 *  with mutually exclusive `.active` styling, matching the legacy behavior
 *  where "Provincia completa" starts active. */
export const initViewPresets = (map: MapLibreMap): void => {
  const metroButton = document.querySelector<HTMLButtonElement>('#viewMetro');
  const peripheryButton = document.querySelector<HTMLButtonElement>('#viewPeriphery');
  const bachilleraButton = document.querySelector<HTMLButtonElement>('#viewBachillera');
  const allButtons = [metroButton, peripheryButton, bachilleraButton];

  const activate = (active: HTMLButtonElement | null): void => {
    allButtons.forEach((button) => button?.classList.toggle('active', button === active));
  };

  metroButton?.addEventListener('click', () => {
    map.fitBounds(BBOX_METRO, { padding: 40, duration: 800 });
    activate(metroButton);
  });
  peripheryButton?.addEventListener('click', () => {
    map.fitBounds(BBOX_PROVINCE, { padding: 30, duration: 800 });
    activate(peripheryButton);
  });
  bachilleraButton?.addEventListener('click', () => {
    map.fitBounds(BBOX_BACHILLERA, { padding: 60, duration: 800, maxZoom: 16.5 });
    activate(bachilleraButton);
  });

  activate(peripheryButton);
};
