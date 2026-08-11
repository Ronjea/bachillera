import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { LngLatBounds } from 'maplibre-gl';
import { t } from '../i18n';
import type { Substation } from '../shared/types';
import { getAllSubstations, setRouteData, setUserPointData } from './state';
import type { RouteCollection, UserPointCollection } from './state';
import { TYPOLOGY_META } from './typology';

const EARTH_RADIUS_KM = 6371;
/** Photon geocoding bias: Sevilla city-center coordinates, matching the
 *  legacy app so results stay local to the province. */
const PHOTON_BIAS = { lat: 37.389, lon: -5.9845, scale: 0.3 };
const RESULT_COUNT = 5;

export const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistanceKm = (km: number): string => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(2)} km`);

type GeocodedPoint = { lat: number; lon: number };

const buildGeocodeQuery = (rawQuery: string): string => {
  const trimmed = rawQuery.trim();
  const isPostalCode = /^\d{5}$/.test(trimmed);
  return isPostalCode ? `${trimmed} Sevilla, España` : `${trimmed}, Sevilla, España`;
};

/** Geocodes a free-text query (address or 5-digit postal code) via Photon
 *  (komoot.io), biased toward Sevilla. Never use Nominatim here — it
 *  rate-limits (429) from this app's typical hosting environments. */
export const geocode = async (rawQuery: string): Promise<GeocodedPoint> => {
  const query = buildGeocodeQuery(rawQuery);
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lat=${PHOTON_BIAS.lat}&lon=${PHOTON_BIAS.lon}&location_bias_scale=${PHOTON_BIAS.scale}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('network');

  // Justified assertion: external API boundary. Only the one field this
  // function needs is read, and it is validated defensively below.
  const data = (await response.json()) as { features?: Array<{ geometry?: { coordinates?: unknown } }> };
  const coordinates = data.features?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) throw new Error('not_found');

  const [lon, lat] = coordinates;
  if (typeof lon !== 'number' || typeof lat !== 'number') throw new Error('not_found');
  return { lat, lon };
};

type RankedSubstation = { substation: Substation; distanceKm: number };

export const nearestSubstations = (lat: number, lon: number, count = RESULT_COUNT): RankedSubstation[] =>
  getAllSubstations()
    .map((substation) => ({ substation, distanceKm: haversineKm(lat, lon, substation.lat, substation.lon) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);

const buildResultCardHtml = (rank: number, substation: Substation, distanceKm: number): string => {
  const meta = TYPOLOGY_META[substation.typology];
  return `
    <div class="result-card rank-${rank}" data-lat="${substation.lat}" data-lon="${substation.lon}" data-testid="card-result-${rank}">
      <div class="result-card-top">
        <span class="result-card-name"><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${meta.color};margin-right:6px;"></span>${substation.name}</span>
        <span class="result-card-dist">${formatDistanceKm(distanceKm)}</span>
      </div>
      <div class="result-card-meta">${substation.municipality} · ${t(meta.labelKey)} · ${substation.maxVoltageKv} kV</div>
    </div>
  `;
};

/** Renders the ranked result cards, wires their click-to-flyTo behavior, and
 *  draws the route line + user point to the nearest substation, fitting the
 *  map to include the user and all ranked results. */
const renderProximityResults = (map: MapLibreMap, userPoint: GeocodedPoint, ranked: RankedSubstation[]): void => {
  const results = document.querySelector<HTMLDivElement>('#proximityResults');
  const nearest = ranked[0];
  if (!results || !nearest) return;

  results.innerHTML = ranked.map(({ substation, distanceKm }, index) => buildResultCardHtml(index, substation, distanceKm)).join('');

  results.querySelectorAll<HTMLDivElement>('.result-card').forEach((card) => {
    card.addEventListener('click', () => {
      const lat = Number(card.dataset.lat);
      const lon = Number(card.dataset.lon);
      map.flyTo({ center: [lon, lat], zoom: 13, duration: 800 });
    });
  });

  const routeData: RouteCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [userPoint.lon, userPoint.lat],
            [nearest.substation.lon, nearest.substation.lat],
          ],
        },
        properties: {},
      },
    ],
  };
  const userPointData: UserPointCollection = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [userPoint.lon, userPoint.lat] }, properties: {} },
    ],
  };

  setRouteData(routeData);
  setUserPointData(userPointData);
  map.getSource<GeoJSONSource>('route')?.setData(routeData);
  map.getSource<GeoJSONSource>('user-point')?.setData(userPointData);

  const bounds = new LngLatBounds();
  bounds.extend([userPoint.lon, userPoint.lat]);
  ranked.forEach(({ substation }) => bounds.extend([substation.lon, substation.lat]));
  map.fitBounds(bounds, { padding: 80, duration: 900, maxZoom: 14 });
};

/** Wires the proximity form (text search) and the "use my location" button.
 *  Both funnel into the same runSearch/renderProximityResults pipeline. */
export const initProximityTool = (map: MapLibreMap): void => {
  const form = document.querySelector<HTMLFormElement>('#proximityForm');
  const input = document.querySelector<HTMLInputElement>('#proximityInput');
  const status = document.querySelector<HTMLDivElement>('#proximityStatus');
  const useLocationButton = document.querySelector<HTMLButtonElement>('#useMyLocation');
  const submitButton = document.querySelector<HTMLButtonElement>('#proximitySubmit');
  if (!form || !input || !status || !useLocationButton || !submitButton) return;

  const setStatus = (message: string, kind?: 'success' | 'error'): void => {
    status.className = kind ? `proximity-status ${kind}` : 'proximity-status';
    status.textContent = message;
  };

  const runSearch = (point: GeocodedPoint, sourceLabel: string): void => {
    const ranked = nearestSubstations(point.lat, point.lon);
    const nearest = ranked[0];
    if (!nearest) return;
    renderProximityResults(map, point, ranked);
    setStatus(
      t('map:proximity.status.nearestResult', {
        source: sourceLabel,
        name: nearest.substation.name,
        distance: formatDistanceKm(nearest.distanceKm),
      }),
      'success',
    );
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    setStatus(t('map:proximity.status.searching'));
    submitButton.disabled = true;
    geocode(query)
      .then((point) => runSearch(point, t('map:proximity.status.foundBySearch')))
      .catch(() => setStatus(t('map:proximity.status.errorNotFound'), 'error'))
      .finally(() => {
        submitButton.disabled = false;
      });
  });

  useLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      setStatus(t('map:proximity.status.errorGeolocationUnsupported'), 'error');
      return;
    }
    setStatus(t('map:proximity.status.locating'));
    navigator.geolocation.getCurrentPosition(
      (position) =>
        runSearch({ lat: position.coords.latitude, lon: position.coords.longitude }, t('map:proximity.status.foundByGps')),
      () => setStatus(t('map:proximity.status.errorGeolocationFailed'), 'error'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
};
