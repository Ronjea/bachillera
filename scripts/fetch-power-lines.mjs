#!/usr/bin/env node
// Fetch OSM power line data (power=line / power=cable ways) for the province
// of Seville and its metro area from the Overpass API, then transform the
// raw response into the GeoJSON files consumed by the map app.
//
// Usage:
//   node scripts/fetch-power-lines.mjs                 fetch from Overpass, cache, transform, write outputs
//   node scripts/fetch-power-lines.mjs --transform-only rebuild outputs from the existing cache, no network calls
//
// No npm dependencies: uses Node's native fetch/AbortController and fs APIs.

import { writeFile, readFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const CACHE_DIR = path.join(ROOT_DIR, "scripts", "cache");
const DATA_DIR = path.join(ROOT_DIR, "public", "data");
const DEBUG_DIR = path.join(DATA_DIR, "_debug");

const PROVINCE_CACHE_PATH = path.join(CACHE_DIR, "overpass-province.json");
const PROVINCE_META_PATH = path.join(CACHE_DIR, "overpass-province.meta.json");
const METRO_CACHE_PATH = path.join(CACHE_DIR, "overpass-metro.json");
const METRO_META_PATH = path.join(CACHE_DIR, "overpass-metro.meta.json");

const PUBLISHED_PATH = path.join(DATA_DIR, "power-lines.geojson");
const METRO_DEBUG_PATH = path.join(DEBUG_DIR, "power-lines-metro.geojson");
const PROVINCE_FULL_DEBUG_PATH = path.join(DEBUG_DIR, "power-lines-province-full.geojson");

// Ordered failover list: public Overpass instance first, then two mirrors.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

const RETRIES_PER_ENDPOINT = 3;
const RETRY_BACKOFF_MS = 2000; // multiplied by attempt number
const REQUEST_TIMEOUT_MS = 180_000;
const FULL_ROUND_RETRY_DELAY_MS = 120_000; // Overpass has been flaky; wait ~2 min before a full retry
const MAX_ROUNDS = 2; // one initial pass over all endpoints + one retry pass

// Node's fetch sends "User-Agent: node" by default, which live testing showed gets
// rejected outright: overpass-api.de returns HTTP 406 and overpass.kumi.systems
// returns HTTP 429 with the body "Please include a meaningful User-Agent string
// with your requests to avoid rate-limiting." A descriptive UA (per Overpass's own
// usage policy) is required simply to reach the API, not an optional nicety.
const USER_AGENT = "bachillera-power-lines-fetch/1.0 (Seville substations map data pipeline; contact: javi@qamarero.com)";

// Overpass bbox order is (south, west, north, east) -- note this differs from
// GeoJSON's [west, south, east, north] convention used everywhere else below.
// power=minor_line is intentionally excluded; voltage is not filtered server
// side because the tag is multivalued/unreliable, so classification happens locally.
const QUERIES = {
  province: `[out:json][timeout:180];
(
  way["power"="line"]["line"!="bay"](36.9,-6.55,38.2,-4.68);
  way["power"="cable"]["line"!="bay"](36.9,-6.55,38.2,-4.68);
);
out geom;`,
  metro: `[out:json][timeout:180];
(
  way["power"="line"]["line"!="bay"](37.18,-6.15,37.62,-5.6);
  way["power"="cable"]["line"!="bay"](37.18,-6.15,37.62,-5.6);
);
out geom;`,
};

// Reference point for the documented Cross San Jeronimo-Empalme undergrounding.
const UNDERGROUND_CHECK_POINT = { lat: 37.42, lon: -5.98, maxKm: 5 };

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function writeJsonCompact(filePath, data) {
  await writeFile(filePath, JSON.stringify(data), "utf8");
}

async function writeJsonPretty(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function fileSizeKb(filePath) {
  const info = await stat(filePath);
  return Math.round((info.size / 1024) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Pure transform helpers (exported for standalone testing without network/fs)
// ---------------------------------------------------------------------------

export function round5(value) {
  return Math.round(value * 1e5) / 1e5;
}

// tags.voltage can be a single value or a ";"-separated list (e.g. "220000;132000").
// Returns the highest value in kV, or null when no valid numeric value is present.
export function parseVoltageKv(voltageTag) {
  if (typeof voltageTag !== "string" || voltageTag.trim() === "") return null;
  const values = voltageTag
    .split(";")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (values.length === 0) return null;
  const maxVolts = Math.max(...values);
  return Math.round((maxVolts / 1000) * 1000) / 1000; // guard against float noise
}

export function classifyVoltageClass(voltageKv) {
  if (voltageKv === null) return "unknown";
  if (voltageKv >= 220) return "high";
  if (voltageKv > 66) return "medium";
  return "low";
}

function parseCircuits(tags) {
  if (tags.circuits === undefined) return null;
  const value = Number.parseInt(tags.circuits, 10);
  return Number.isFinite(value) ? value : null;
}

// Converts one Overpass "way" element (from `out geom`) into a GeoJSON Feature,
// or null when the element should be discarded.
export function wayToFeature(element) {
  if (element.type !== "way") return null;
  const tags = element.tags ?? {};
  if (tags.line === "bay" || tags.line === "busbar") return null;

  const geometry = Array.isArray(element.geometry) ? element.geometry : [];
  const coordinates = geometry
    .filter((point) => point && typeof point.lat === "number" && typeof point.lon === "number")
    .map((point) => [round5(point.lon), round5(point.lat)]);
  if (coordinates.length < 2) return null;

  const kind = tags.power === "cable" || tags.location === "underground" ? "underground" : "overhead";
  const voltageKv = parseVoltageKv(tags.voltage);
  const voltageClass = classifyVoltageClass(voltageKv);

  return {
    type: "Feature",
    properties: {
      id: `way/${element.id}`,
      kind,
      voltageClass,
      voltageKv,
      name: tags.name ?? tags.ref ?? null,
      circuits: parseCircuits(tags),
      cables: tags.cables ?? null,
      source: "osm",
    },
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

export function dedupeFeaturesById(features) {
  const seen = new Map();
  for (const feature of features) {
    if (!seen.has(feature.properties.id)) {
      seen.set(feature.properties.id, feature);
    }
  }
  return [...seen.values()];
}

export function buildFeatureCollection(features, extractedAt) {
  return {
    type: "FeatureCollection",
    metadata: {
      extractedAt,
      source: "OpenStreetMap via Overpass API",
      license: "ODbL 1.0",
      attribution: "© OpenStreetMap contributors",
    },
    features,
  };
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Finds underground features with at least one vertex within maxKm of the target point.
export function findNearbyUndergroundFeatures(features, { lat, lon, maxKm }) {
  const matches = [];
  for (const feature of features) {
    if (feature.properties.kind !== "underground") continue;
    let minDistance = Infinity;
    for (const [pointLon, pointLat] of feature.geometry.coordinates) {
      const distance = haversineKm(lat, lon, pointLat, pointLon);
      if (distance < minDistance) minDistance = distance;
    }
    if (minDistance <= maxKm) {
      matches.push({
        id: feature.properties.id,
        name: feature.properties.name,
        voltageClass: feature.properties.voltageClass,
        voltageKv: feature.properties.voltageKv,
        distanceKm: Math.round(minDistance * 1000) / 1000,
      });
    }
  }
  return matches.sort((a, b) => a.distanceKm - b.distanceKm);
}

export function summarizeByVoltageAndKind(features) {
  const summary = {};
  for (const feature of features) {
    const { voltageClass, kind } = feature.properties;
    summary[voltageClass] ??= {};
    summary[voltageClass][kind] = (summary[voltageClass][kind] ?? 0) + 1;
  }
  return summary;
}

// ---------------------------------------------------------------------------
// Overpass fetching with per-endpoint retries and a two-round failover
// ---------------------------------------------------------------------------

async function postToOverpass(endpoint, query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain", Accept: "*/*", "User-Agent": USER_AGENT },
      body: query,
      signal: controller.signal,
    });
    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status} ${response.statusText}${bodyText ? ` -- ${bodyText.slice(0, 300)}` : ""}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchFromEndpointWithRetries(endpoint, query, label) {
  for (let attempt = 1; attempt <= RETRIES_PER_ENDPOINT; attempt++) {
    try {
      log(`[${label}] ${endpoint} - attempt ${attempt}/${RETRIES_PER_ENDPOINT}`);
      return await postToOverpass(endpoint, query);
    } catch (error) {
      const reason = error.name === "AbortError" ? `timed out after ${REQUEST_TIMEOUT_MS / 1000}s` : error.message;
      log(`[${label}] ${endpoint} - attempt ${attempt} failed: ${reason}`);
      if (attempt < RETRIES_PER_ENDPOINT) {
        await sleep(RETRY_BACKOFF_MS * attempt);
      }
    }
  }
  return null;
}

async function fetchOneRound(query, label) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const data = await fetchFromEndpointWithRetries(endpoint, query, label);
    if (data) return { data, endpoint };
  }
  return null;
}

// Tries every endpoint (with retries) up to MAX_ROUNDS times, waiting
// FULL_ROUND_RETRY_DELAY_MS between rounds. Returns null if Overpass never responded.
async function fetchWithFailover(query, label) {
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    log(`[${label}] Starting endpoint round ${round}/${MAX_ROUNDS}`);
    const result = await fetchOneRound(query, label);
    if (result) return result;
    if (round < MAX_ROUNDS) {
      log(`[${label}] All endpoints failed on round ${round}. Waiting ${FULL_ROUND_RETRY_DELAY_MS / 1000}s before a full retry.`);
      await sleep(FULL_ROUND_RETRY_DELAY_MS);
    }
  }
  return null;
}

// Loads one dataset either from the network (caching the raw response first)
// or from the existing cache when transformOnly is set.
async function loadDataset({ label, query, cachePath, metaPath, transformOnly }) {
  if (transformOnly) {
    const raw = await readJsonIfExists(cachePath);
    if (!raw) {
      log(`[${label}] --transform-only requested but no cache found at ${cachePath}`);
      return { elements: null, fetchedAt: null, endpoint: null, mirrorUsed: false, fromCache: true, error: "no-cache" };
    }
    const meta = await readJsonIfExists(metaPath);
    const fetchedAt = meta?.fetchedAt ?? (await stat(cachePath)).mtime.toISOString();
    log(`[${label}] Loaded ${raw.elements?.length ?? 0} elements from cache (fetched ${fetchedAt}).`);
    return {
      elements: raw.elements ?? [],
      fetchedAt,
      endpoint: meta?.endpoint ?? "unknown (cache predates metadata sidecar)",
      mirrorUsed: meta ? meta.endpoint !== OVERPASS_ENDPOINTS[0] : null,
      fromCache: true,
    };
  }

  const result = await fetchWithFailover(query, label);
  if (!result) {
    log(`[${label}] All Overpass endpoints failed after ${MAX_ROUNDS} full rounds. No data fetched this run.`);
    return { elements: null, fetchedAt: null, endpoint: null, mirrorUsed: false, fromCache: false, error: "overpass-unreachable" };
  }

  // Persist the raw response before any transformation, as required.
  await writeJsonCompact(cachePath, result.data);
  const fetchedAt = new Date().toISOString();
  const mirrorUsed = result.endpoint !== OVERPASS_ENDPOINTS[0];
  await writeJsonPretty(metaPath, { fetchedAt, endpoint: result.endpoint, label });
  log(`[${label}] Fetched ${result.data.elements?.length ?? 0} elements via ${result.endpoint} -> cached at ${cachePath}`);

  return { elements: result.data.elements ?? [], fetchedAt, endpoint: result.endpoint, mirrorUsed, fromCache: false };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const transformOnly = process.argv.includes("--transform-only");
  log(`Starting power-lines pipeline (transformOnly=${transformOnly})`);

  await ensureDir(CACHE_DIR);
  await ensureDir(DATA_DIR);
  await ensureDir(DEBUG_DIR);

  const province = await loadDataset({
    label: "province",
    query: QUERIES.province,
    cachePath: PROVINCE_CACHE_PATH,
    metaPath: PROVINCE_META_PATH,
    transformOnly,
  });
  const metro = await loadDataset({
    label: "metro",
    query: QUERIES.metro,
    cachePath: METRO_CACHE_PATH,
    metaPath: METRO_META_PATH,
    transformOnly,
  });

  const provinceFeatures = province.elements
    ? dedupeFeaturesById(province.elements.map(wayToFeature).filter(Boolean))
    : null;
  const metroFeatures = metro.elements
    ? dedupeFeaturesById(metro.elements.map(wayToFeature).filter(Boolean))
    : null;

  const written = [];

  if (metroFeatures) {
    const fc = buildFeatureCollection(metroFeatures, metro.fetchedAt);
    await writeJsonCompact(METRO_DEBUG_PATH, fc);
    written.push({ file: METRO_DEBUG_PATH, label: "metro (debug)", features: metroFeatures });
  } else {
    log("Skipping _debug/power-lines-metro.geojson: metro dataset unavailable.");
  }

  if (provinceFeatures) {
    const fc = buildFeatureCollection(provinceFeatures, province.fetchedAt);
    await writeJsonCompact(PROVINCE_FULL_DEBUG_PATH, fc);
    written.push({ file: PROVINCE_FULL_DEBUG_PATH, label: "province-full (debug)", features: provinceFeatures });
  } else {
    log("Skipping _debug/power-lines-province-full.geojson: province dataset unavailable.");
  }

  if (provinceFeatures && metroFeatures) {
    const highVoltageProvince = provinceFeatures.filter((f) => f.properties.voltageClass === "high");
    const published = dedupeFeaturesById([...highVoltageProvince, ...metroFeatures]);
    const extractedAt = [province.fetchedAt, metro.fetchedAt].sort().at(-1);
    const fc = buildFeatureCollection(published, extractedAt);
    await writeJsonCompact(PUBLISHED_PATH, fc);
    written.push({ file: PUBLISHED_PATH, label: "published", features: published });
  } else {
    log("Skipping power-lines.geojson (published): requires both province and metro datasets.");
  }

  await printReport({ province, metro, provinceFeatures, metroFeatures, written });

  if (!provinceFeatures || !metroFeatures) {
    process.exitCode = 1;
  }
}

async function printReport({ province, metro, provinceFeatures, metroFeatures, written }) {
  console.log("\n=== Overpass fetch status ===");
  for (const [label, dataset] of [["province", province], ["metro", metro]]) {
    if (dataset.error) {
      console.log(`  ${label}: FAILED (${dataset.error})`);
    } else {
      const mirrorNote = dataset.mirrorUsed ? " [MIRROR]" : "";
      const sourceNote = dataset.fromCache ? "cache" : "live fetch";
      console.log(`  ${label}: OK via ${dataset.endpoint}${mirrorNote} (${sourceNote}, extracted ${dataset.fetchedAt})`);
    }
  }

  console.log("\n=== Output variants ===");
  for (const entry of written) {
    const sizeKb = await fileSizeKb(entry.file);
    const summary = summarizeByVoltageAndKind(entry.features);
    console.log(`\n${entry.label} -> ${entry.file}`);
    console.log(`  total features: ${entry.features.length}, size: ${sizeKb} KB`);
    console.table(
      Object.entries(summary).flatMap(([voltageClass, kinds]) =>
        Object.entries(kinds).map(([kind, count]) => ({ voltageClass, kind, count }))
      )
    );
    if (entry.file === PUBLISHED_PATH && sizeKb > 5 * 1024) {
      console.log(`  WARNING: published file exceeds the 5 MB target (${sizeKb} KB).`);
    }
  }

  const combined = dedupeFeaturesById([...(provinceFeatures ?? []), ...(metroFeatures ?? [])]);
  if (combined.length > 0) {
    const unknownCount = combined.filter((f) => f.properties.voltageClass === "unknown").length;
    console.log(`\n=== Validation ===`);
    console.log(`Segments with unknown voltage (combined province+metro, deduped): ${unknownCount} / ${combined.length}`);

    const nearby = findNearbyUndergroundFeatures(combined, UNDERGROUND_CHECK_POINT);
    if (nearby.length > 0) {
      console.log(`Underground features within ${UNDERGROUND_CHECK_POINT.maxKm} km of (${UNDERGROUND_CHECK_POINT.lat}, ${UNDERGROUND_CHECK_POINT.lon}):`);
      for (const match of nearby) {
        console.log(`  - ${match.id} "${match.name ?? "(unnamed)"}" voltageClass=${match.voltageClass} voltageKv=${match.voltageKv} distance=${match.distanceKm} km`);
      }
    } else {
      console.log(`No underground features found within ${UNDERGROUND_CHECK_POINT.maxKm} km of (${UNDERGROUND_CHECK_POINT.lat}, ${UNDERGROUND_CHECK_POINT.lon}).`);
    }
  } else {
    console.log("\n=== Validation ===\nNo data available (no successful fetch and no usable cache).");
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exitCode = 1;
  });
}
