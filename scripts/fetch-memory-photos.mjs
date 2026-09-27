#!/usr/bin/env node
// Download the curated archive photos listed in scripts/memory-sources.json and
// publish resized copies for memoria.html.
//
// Usage:
//   node scripts/fetch-memory-photos.mjs           download missing originals, then resize
//   node scripts/fetch-memory-photos.mjs --force   re-download every original
//
// The photos are licensed CC BY-NC-ND 4.0: derivative works are not allowed,
// so images are only scaled down (aspect ratio kept, no cropping, no edits).
// Resizing uses macOS `sips` to avoid adding an image-processing dependency.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const SOURCES_PATH = path.join(ROOT_DIR, "scripts", "memory-sources.json");
const CACHE_DIR = path.join(ROOT_DIR, "scripts", "cache", "memoria");
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "images", "memoria");

const FULL_MAX_PX = 1600;
const THUMB_MAX_PX = 640;
const JPEG_QUALITY = "80";
const REQUEST_TIMEOUT_MS = 60_000;
const RETRIES = 3;

// archive.org and the AtoM catalogue throttle anonymous default user agents.
const USER_AGENT = "bachillera-memory-fetch/1.0 (neighbourhood information site, non-commercial)";

const force = process.argv.includes("--force");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const download = async (url, target) => {
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        redirect: "follow",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const type = response.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) throw new Error(`unexpected content-type "${type}"`);
      await writeFile(target, Buffer.from(await response.arrayBuffer()));
      return;
    } catch (error) {
      if (attempt === RETRIES) throw error;
      console.warn(`  retry ${attempt}/${RETRIES - 1} for ${url}: ${error.message}`);
      await sleep(1500 * attempt);
    }
  }
};

const longestSide = (file) => {
  const output = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file], { encoding: "utf8" });
  const values = [...output.matchAll(/pixel(?:Width|Height):\s*(\d+)/g)].map((match) => Number(match[1]));
  return Math.max(...values);
};

// -Z sets the longest side and keeps the aspect ratio; it would also upscale,
// so small originals are only re-encoded.
const resize = (source, target, maxPx) => {
  const scale = longestSide(source) > maxPx ? ["-Z", String(maxPx)] : [];
  execFileSync("sips", [
    "-s", "format", "jpeg",
    "-s", "formatOptions", JPEG_QUALITY,
    ...scale,
    source,
    "--out", target,
  ], { stdio: "ignore" });
};

const main = async () => {
  const sources = JSON.parse(await readFile(SOURCES_PATH, "utf8"));
  const entries = [...(sources.photos ?? []), ...(sources.beforeAfter ?? [])];

  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const failures = [];
  for (const { id, downloadUrl } of entries) {
    const original = path.join(CACHE_DIR, `${id}${path.extname(new URL(downloadUrl).pathname) || ".jpg"}`);
    try {
      if (force || !existsSync(original)) {
        console.log(`download ${id}`);
        await download(downloadUrl, original);
      }
      resize(original, path.join(OUTPUT_DIR, `${id}.jpg`), FULL_MAX_PX);
      resize(original, path.join(OUTPUT_DIR, `${id}-thumb.jpg`), THUMB_MAX_PX);
    } catch (error) {
      failures.push(id);
      console.error(`FAILED ${id}: ${error.message}`);
    }
  }

  console.log(`\n${entries.length - failures.length}/${entries.length} images published to public/images/memoria/`);
  if (failures.length > 0) process.exitCode = 1;
};

main();
