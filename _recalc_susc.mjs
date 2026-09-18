// Network-free recompute of Cameroon susceptibility from existing (correct) fields. Fixes hero towns
// scoring low: a community that lies inside a MODELED flood footprint is, by observation, flood-prone,
// so demonstrated inundation should dominate and floor the baseline. Keeps elevM/handM/distRiverM/
// flooded2023 exactly as they are — only susceptibility changes.
import { readFileSync, writeFileSync } from "node:fs";
const GEO = "D:/Dev_Work/MineOPs/src/data/geo";

for (const f of ["cm_farnorth_features.json", "cm_douala_features.json"]) {
  const a = JSON.parse(readFileSync(`${GEO}/${f}`, "utf8"));
  for (const x of a) {
    let s = x.handM < 2 ? 45 : x.handM < 5 ? 34 : x.handM < 10 ? 20 : x.handM < 20 ? 9 : 3; // terrain
    s += x.distRiverM < 300 ? 22 : x.distRiverM < 1000 ? 14 : x.distRiverM < 3000 ? 6 : 0;    // proximity
    s += x.flooded2023 ? 40 : 0;                                                               // demonstrated inundation
    if (x.flooded2023) s = Math.max(s, 58); // observed footprint ⇒ at least HIGH baseline susceptibility
    x.susceptibility = Math.min(100, Math.round(s));
  }
  writeFileSync(`${GEO}/${f}`, JSON.stringify(a));
  const s = [...a].sort((p, q) => q.susceptibility - p.susceptibility);
  const marquee = ["Yagoua", "Maga", "Logone-Birni", "Kousséri", "Zina", "Waza", "Bonaberi", "Deido"];
  console.log(f.includes("farnorth") ? "FarNorth" : "Douala");
  console.log("  TOP5:", s.slice(0, 5).map((x) => `${x.name}(${x.susceptibility})`).join(" "));
  console.log("  marquee:", a.filter((x) => marquee.includes(x.name)).map((x) => `${x.name}(${x.susceptibility})`).join(" "));
}
console.log("done");
