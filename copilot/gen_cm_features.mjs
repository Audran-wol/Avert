import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import distance from "@turf/distance";
import { point } from "@turf/helpers";
import pointToLineDistance from "@turf/point-to-line-distance";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const geoDir = path.join(rootDir, "src", "data", "geo");
const cachePath = path.join(rootDir, ".cache", "cm_srtm_cache.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function pointKey(lat, lng) {
  return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
}

function toElevationMap(items) {
  return new Map(items.map((entry) => [pointKey(entry.lat, entry.lng), entry.elevation]));
}

function buildCacheMap() {
  if (!fs.existsSync(cachePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(cachePath, "utf8"));
  } catch {
    return {};
  }
}

const cache = buildCacheMap();
function saveCache() {
  ensureDir(path.dirname(cachePath));
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n");
}

async function fetchElevations(points) {
  const result = new Map();
  const pending = [];

  for (const p of points) {
    const key = pointKey(p.lat, p.lng);
    if (Object.prototype.hasOwnProperty.call(cache, key)) {
      const elevation = Number(cache[key]);
      result.set(key, Number.isFinite(elevation) ? elevation : null);
    } else {
      pending.push({ ...p, key });
    }
  }

  for (let i = 0; i < pending.length; i += 100) {
    const batch = pending.slice(i, i + 100);
    const locations = batch.map(({ lat, lng }) => `${lat},${lng}`).join("|");
    const response = await fetch("https://api.opentopodata.org/v1/srtm30m", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ locations }).toString(),
    });

    if (!response.ok) {
      throw new Error(`OpenTopoData request failed (${response.status}): ${await response.text()}`);
    }

    const payload = await response.json();
    for (const item of payload.results ?? []) {
      const lat = Number(item.location?.lat ?? item.latitude);
      const lng = Number(item.location?.lng ?? item.longitude);
      const elevation = Number(item.elevation);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(elevation)) {
        const key = pointKey(lat, lng);
        cache[key] = elevation;
        result.set(key, elevation);
      }
    }

    for (const entry of batch) {
      if (!result.has(entry.key)) {
        cache[entry.key] = null;
      }
    }

    saveCache();
    if (i + 100 < pending.length) {
      await sleep(1100);
    }
  }

  for (const p of points) {
    const key = pointKey(p.lat, p.lng);
    if (!result.has(key)) {
      const value = Number(cache[key]);
      result.set(key, Number.isFinite(value) ? value : null);
    }
  }

  return result;
}

function nearestPointOnLine(pt, line) {
  let best = { dist: Infinity, coord: null };
  const coords = line.geometry.coordinates;

  for (let i = 0; i < coords.length - 1; i += 1) {
    const a = coords[i];
    const b = coords[i + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / lenSq;
    const clamped = Math.max(0, Math.min(1, t));
    const candidate = [a[0] + clamped * dx, a[1] + clamped * dy];
    const d = distance(point(pt), point(candidate), { units: "meters" });
    if (d < best.dist) {
      best = { dist: d, coord: candidate };
    }
  }

  return best;
}

function inAnyExtent(point, extents) {
  return extents.some((geometry) => booleanPointInPolygon([point.lng, point.lat], geometry));
}

async function buildRegion(region) {
  const { communityFile, riverFile, extentFiles, channelName, outputFile } = region;
  const communities = loadJson(path.join(geoDir, communityFile));
  const rivers = loadJson(path.join(geoDir, riverFile));
  const channelLines = rivers.features.filter((f) => (f.properties?.name || "").toLowerCase() === channelName.toLowerCase());

  const points = communities.features.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    return { lat, lng, name: f.properties?.name || "unknown" };
  });

  const elevationMap = toElevationMap([...points, ...points.flatMap((p) => [])]);
  const allElevations = await fetchElevations(points);

  const riverCoords = [];
  for (const line of channelLines) {
    for (const [lng, lat] of line.geometry.coordinates) {
      riverCoords.push({ lat, lng });
    }
  }
  const riverElevations = await fetchElevations(riverCoords);

  const extents = extentFiles
    .map((file) => {
      const fc = loadJson(path.join(geoDir, file));
      const lastStep = fc.features.at(-1);
      return lastStep?.geometry ?? null;
    })
    .filter(Boolean);

  const featureRows = communities.features.map((feature, i) => {
    const [lng, lat] = feature.geometry.coordinates;
    const name = feature.properties?.name || `Community-${i}`;
    const elevM = Number(allElevations.get(pointKey(lat, lng)) ?? 0);
    const distRiverM = Math.min(...channelLines.map((line) => pointToLineDistance([lng, lat], line, { units: "meters" })));

    // Primary HAND method: nearest-channel elevation difference. If a nearby river coordinate has no valid
    // elevation, fall back to the distance-decay proxy from the task guidance.
    let channelElevM = null;
    let nearest = { dist: Infinity, coord: null };
    for (const line of channelLines) {
      const candidate = nearestPointOnLine([lng, lat], line);
      if (candidate.dist < nearest.dist) nearest = candidate;
    }
    if (nearest.coord) {
      const nearestLat = nearest.coord[1];
      const nearestLng = nearest.coord[0];
      channelElevM = Number(riverElevations.get(pointKey(nearestLat, nearestLng)) ?? null);
    }

    let handM = null;
    if (Number.isFinite(elevM) && Number.isFinite(channelElevM)) {
      handM = Math.max(0, elevM - channelElevM);
    } else if (Number.isFinite(elevM)) {
      handM = Math.min(elevM, 2 + distRiverM / 120);
    }
    if (!Number.isFinite(handM)) {
      handM = 0;
    }

    const flooded2023 = inAnyExtent({ lat, lng }, extents);
    let susceptibility = 0;
    susceptibility += handM < 2 ? 45 : handM < 5 ? 34 : handM < 10 ? 20 : handM < 20 ? 9 : 3;
    susceptibility += distRiverM < 300 ? 22 : distRiverM < 1000 ? 14 : distRiverM < 3000 ? 6 : 0;
    susceptibility += flooded2023 ? 18 : 0;
    susceptibility = Math.min(100, Math.round(susceptibility));

    return {
      name,
      elevM: Number(elevM.toFixed(1)),
      handM: Number(handM.toFixed(1)),
      distRiverM: Number(distRiverM.toFixed(1)),
      flooded2023,
      susceptibility,
    };
  });

  fs.writeFileSync(outputFile, JSON.stringify(featureRows, null, 2) + "\n");
  return featureRows;
}

async function main() {
  const regions = [
    {
      communityFile: "cm_farnorth_communities.json",
      riverFile: "cm_farnorth_rivers.json",
      extentFiles: ["cm_fn2020.json", "cm_fn2024.json", "cm_yagoua2022.json"],
      channelName: "Logone",
      outputFile: path.join(geoDir, "cm_farnorth_features.json"),
    },
    {
      communityFile: "cm_douala_communities.json",
      riverFile: "cm_douala_rivers.json",
      extentFiles: ["cm_dla2020.json", "cm_dla2021.json"],
      channelName: "Wouri",
      outputFile: path.join(geoDir, "cm_douala_features.json"),
    },
  ];

  const results = {};
  for (const region of regions) {
    const rows = await buildRegion(region);
    const regionCode = region.outputFile.includes("farnorth") ? "FN" : "DL";
    results[regionCode] = rows;

    const top10 = [...rows].sort((a, b) => b.susceptibility - a.susceptibility).slice(0, 10);
    const bottom5 = [...rows].sort((a, b) => a.susceptibility - b.susceptibility).slice(0, 5);

    console.log(`\n=== ${regionCode} TOP 10 ===`);
    for (const row of top10) {
      console.log(`${row.name}: susceptibility=${row.susceptibility}, handM=${row.handM}, distRiverM=${row.distRiverM}, flooded2023=${row.flooded2023}`);
    }

    console.log(`\n=== ${regionCode} BOTTOM 5 ===`);
    for (const row of bottom5) {
      console.log(`${row.name}: susceptibility=${row.susceptibility}, handM=${row.handM}, distRiverM=${row.distRiverM}, flooded2023=${row.flooded2023}`);
    }
  }

  console.log("\nSanity checks:");
  console.log("Far North high-risk names:", results.FN.filter((row) => ["Yagoua", "Maga", "Kousséri", "Logone-Birni"].includes(row.name)).map((row) => `${row.name}:${row.susceptibility}`).join(" | "));
  console.log("Douala high-risk names:", results.DL.filter((row) => ["Douala", "Deido", "Bonaberi"].includes(row.name)).map((row) => `${row.name}:${row.susceptibility}`).join(" | "));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
