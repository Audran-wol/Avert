// Regenerate real SRTM elevation for the Cameroon susceptibility files, preserving Copilot's
// (correct) distRiverM + flooded2023. handM = height above the regional floodplain datum (a low
// percentile of near-channel community elevations) — a documented HAND proxy for these flat basins.
import { readFileSync, writeFileSync } from "node:fs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GEO = "D:/Dev_Work/MineOPs/src/data/geo";

async function elevations(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i += 100) {
    const batch = pts.slice(i, i + 100);
    const locs = batch.map(([lng, lat]) => `${lat},${lng}`).join("|");
    const r = await fetch(`https://api.opentopodata.org/v1/srtm30m?locations=${locs}`);
    const d = await r.json();
    if (!d.results) throw new Error("opentopodata: " + JSON.stringify(d).slice(0, 200));
    for (const res of d.results) out.push(res.elevation ?? 0);
    await sleep(1100); // public limit: 1 req/s
  }
  return out;
}
const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

async function regen(commFile, featFile, label) {
  const comm = JSON.parse(readFileSync(`${GEO}/${commFile}`, "utf8"));
  const feats = JSON.parse(readFileSync(`${GEO}/${featFile}`, "utf8"));
  if (comm.features.length !== feats.length) throw new Error(`${label}: length mismatch ${comm.features.length} vs ${feats.length}`);
  const pts = comm.features.map((f) => f.geometry.coordinates);
  console.log(`${label}: fetching ${pts.length} elevations…`);
  const elev = await elevations(pts);
  // floodplain datum = 15th-percentile elevation of communities within 1.5 km of the channel
  const near = elev.filter((_, i) => feats[i].distRiverM < 1500);
  const datum = pct(near.length >= 5 ? near : elev, 0.15);
  console.log(`${label}: datum elev = ${datum} m (from ${near.length} near-channel pts)`);
  feats.forEach((f, i) => {
    f.elevM = Math.round(elev[i]);
    f.handM = Math.max(0, +(elev[i] - datum).toFixed(1));
    let s = f.handM < 2 ? 45 : f.handM < 5 ? 34 : f.handM < 10 ? 20 : f.handM < 20 ? 9 : 3;
    s += f.distRiverM < 300 ? 22 : f.distRiverM < 1000 ? 14 : f.distRiverM < 3000 ? 6 : 0;
    s += f.flooded2023 ? 18 : 0;
    f.susceptibility = Math.min(100, Math.round(s));
  });
  writeFileSync(`${GEO}/${featFile}`, JSON.stringify(feats));
  const sorted = [...feats].sort((a, b) => b.susceptibility - a.susceptibility);
  console.log(`${label} TOP5:`, sorted.slice(0, 5).map((f) => `${f.name}(s${f.susceptibility},h${f.handM},d${Math.round(f.distRiverM)})`).join(" "));
  console.log(`${label} BOT5:`, sorted.slice(-5).map((f) => `${f.name}(s${f.susceptibility},h${f.handM},d${Math.round(f.distRiverM)})`).join(" "));
}

await regen("cm_farnorth_communities.json", "cm_farnorth_features.json", "FarNorth");
await regen("cm_douala_communities.json", "cm_douala_features.json", "Douala");
console.log("done");
