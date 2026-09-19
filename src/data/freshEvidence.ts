// Incremental research pack merged 2026-09-19 (see /record at repo root for full provenance:
// records.json, media_registry.json, FINDINGS.md). These are news/report-level observations,
// not modeled flood extents — no geometry, shown as evidence, never drawn on the map.
export type FreshRecordType =
  | "incident" | "update" | "warning" | "monitoring" | "observation" | "assessment" | "aggregate";

export interface FreshPhoto { url: string; credit: string; sourceUrl: string }

export interface FreshRecord {
  id: string;
  country: "GHA" | "CMR";
  title: string;
  type: FreshRecordType;
  dateLabel: string;
  locations: string[];
  summary: string;
  photos: FreshPhoto[];
}

const cred = (url: string, credit: string, sourceUrl: string): FreshPhoto => ({ url, credit, sourceUrl });

export const FRESH_RECORDS: FreshRecord[] = [
  {
    id: "AV-CM-DLA-202609", country: "CMR", title: "Douala September flooding", type: "incident",
    dateLabel: "10–11 Sep 2026 (reported)",
    locations: ["Douala V", "Bonamoussadi", "Sable", "Bepanda-Bonabo", "Makèpè-Missokè"],
    summary: "Local and broadcast reporting describes flooded streets and homes, disrupted school attendance and transport. A follow-up report on 18 September describes further impacts, citing a different overnight window (12–13 Sep) — both dates are preserved rather than merged.",
    photos: [
      cred("https://images.euronews.com/articles/stories/09/91/07/29/1024x538_cmsv2_11e9ea98-4864-599a-9cdb-a37ec538d3e0-9910729.jpg", "Africanews", "https://www.africanews.com/2026/09/12/cameroons-economic-capital-douala-wakes-up-underwater-after-heavy-rains/"),
      cred("https://www.cameroon-tribune.cm//administrateur/photo/normal_dbg76f9.jpg", "Cameroon Tribune", "https://www.cameroon-tribune.cm/article.html/80602/fr.html/douala-v-les-eaux-sont-montees"),
      cred("https://www.duala.info/newspics/3650.jpg", "Duala Info / Camerounlink", "https://www.duala.info/m/actu/douala-les-fortes-pluies-et-la-maree-haute-provoquent-des-debordements-dans-plusieurs-quartiers/3650"),
      cred("https://admin.diaspocamtv.com/storage/gallery/2026/09/12/isit4o67kdpjvkdkg0r3609r3j4ii2.jpeg", "Diaspocam TV", "https://diaspocamtv.com/news/details/inondations-a-douala-v-le-gouverneur-du-littoral-sur-le-terrain"),
      cred("https://www.stopblablacam.com/media/k2/items/cache/4b0f993971312740a416f1b957b79fe4_M.jpg", "StopBlaBlaCam", "https://www.stopblablacam.com/societe/1809-16819-inondations-a-douala-pres-de-500-menages-touches-et-environ-200-personnes-deplacees"),
    ],
  },
  {
    id: "AV-CM-DLA-UPDATE-20260918", country: "CMR", title: "Douala humanitarian impact update", type: "update",
    dateLabel: "Published 18 Sep 2026", locations: ["Douala I", "Douala V"],
    summary: "18 September coverage, citing humanitarian reporting, describes approximately 500 affected households and approximately 200 displaced people. The original humanitarian report was not retrieved — treat as reported, not independently verified.",
    photos: [],
  },
  {
    id: "AV-CM-LIM-20260805", country: "CMR", title: "Limbe flooding and Mbende landslide", type: "incident",
    dateLabel: "5 Aug 2026", locations: ["Limbe", "Mbende"],
    summary: "Reports describe flooding in Limbe and a separate landslide at Mbende after heavy rain. Greenpeace attributes three deaths to the landslide, based on residents — a landslide toll, not a flood death count.",
    photos: [cred("https://www.greenpeace.org/static/planet4-africa-stateless/2026/08/8978faf4-763701408_2927128017635279_3270900010944470948_n.jpeg", "Greenpeace Africa", "https://www.greenpeace.org/africa/en/blog/61512/three-lives-lost-in-limbe-cameroon-cannot-keep-meeting-the-rains-with-bare-hands/")],
  },
  {
    id: "AV-CM-KUM-20260805", country: "CMR", title: "Kumba flooding", type: "incident",
    dateLabel: "5 Aug 2026", locations: ["Kumba"],
    summary: "Voice of Nature reports flooding in Kumba during the same August rain episode affecting Limbe. Single NGO report; independent confirmation and town-specific photos are still needed.",
    photos: [],
  },
  {
    id: "AV-GH-ACC-20260629", country: "GHA", title: "Greater Accra June 29 floods", type: "incident",
    dateLabel: "29 Jun 2026", locations: ["Accra", "Tema", "Afienya", "Tse Addo"],
    summary: "Flood reporting supports new locality-specific evidence in Afienya and Tse Addo, plus broader rescue context in Greater Accra. Do not count each gallery or regional report as a separate disaster.",
    photos: [
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-29-at-7.08.17-AM.jpeg", "MyJoyOnline / Albert Kuzor", "https://www.myjoyonline.com/photos-heavy-flooding-leaves-parts-of-afienya-submerged/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/06/image-3652-1024x576.png", "MyJoyOnline / Albert Kuzor", "https://www.myjoyonline.com/photos-heavy-flooding-leaves-parts-of-afienya-submerged/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/06/image-3647-1024x576.png", "MyJoyOnline / Albert Kuzor", "https://www.myjoyonline.com/photos-heavy-flooding-leaves-parts-of-afienya-submerged/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/06/image-3645-1024x576.png", "MyJoyOnline / Albert Kuzor", "https://www.myjoyonline.com/photos-heavy-flooding-leaves-parts-of-afienya-submerged/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/06/image-3644-1024x576.png", "MyJoyOnline / Albert Kuzor", "https://www.myjoyonline.com/photos-heavy-flooding-leaves-parts-of-afienya-submerged/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/06/image-3643-1024x576.png", "MyJoyOnline / Albert Kuzor", "https://www.myjoyonline.com/photos-heavy-flooding-leaves-parts-of-afienya-submerged/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/06/image-3642-1024x576.png", "MyJoyOnline / Albert Kuzor", "https://www.myjoyonline.com/photos-heavy-flooding-leaves-parts-of-afienya-submerged/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/06/accraflood6.jpg", "MyJoyOnline / David Apinga", "https://www.myjoyonline.com/floods-engulf-tse-addo-communities-as-residents-call-for-urgent-intervention/"),
      cred("https://www.greenpeace.org/static/planet4-africa-stateless/2026/07/0b5e5f31-photo-2026-06-29-00-38-54.jpg", "Greenpeace Africa / Sam Quashie-Idun", "https://www.greenpeace.org/africa/en/blog/61137/ghanas-deadly-floods-are-not-a-natural-disaster-theyre-a-wake-up-call/"),
    ],
  },
  {
    id: "AV-GH-TOT-20260629", country: "GHA", title: "Persistent flooding in Totopey", type: "observation",
    dateLabel: "Since 29 Jun 2026 (reported 19 Aug)", locations: ["Totopey", "Ada East", "Songor Lagoon"],
    summary: "An August report describes residents still unable to return home after the June 29 flooding, with water remaining around houses. Recovery publication date is not the date the flood began.",
    photos: [
      cred("https://www.citinewsroom.com/wp-content/uploads/2026/08/TM067-Social-Totopey-Flood-Pic-3.jpg", "GNA via Citi Newsroom", "https://www.citinewsroom.com/2026/08/totopey-residents-remain-displaced-seven-weeks-after-floods/"),
      cred("https://www.citinewsroom.com/wp-content/uploads/2026/08/TM067-Social-Totopey-Flood-Pic-1.jpg", "GNA via Citi Newsroom", "https://www.citinewsroom.com/2026/08/totopey-residents-remain-displaced-seven-weeks-after-floods/"),
      cred("https://www.citinewsroom.com/wp-content/uploads/2026/08/TM067-Social-Totopey-Flood-Pic-2.jpg", "GNA via Citi Newsroom", "https://www.citinewsroom.com/2026/08/totopey-residents-remain-displaced-seven-weeks-after-floods/"),
    ],
  },
  {
    id: "AV-GH-ANLO-2026", country: "GHA", title: "Flood impacts at Anlo Afiadenyigba", type: "observation",
    dateLabel: "Reported 12 Jul 2026", locations: ["Anlo Afiadenyigba", "Keta Municipality"],
    summary: "July reporting describes inundated homes and schools and receding water after Keta Lagoon floodgates opened. Possible overlap with the late-June 2026 Volta flooding episode.",
    photos: [
      cred("https://www.citinewsroom.com/wp-content/uploads/2026/07/anlo-3.jpeg", "Citi Newsroom / Desmond Selase Aggor", "https://www.citinewsroom.com/2026/07/anlo-afiadenyigba-residents-raise-alarm-over-disease-risk-after-floods/"),
      cred("https://www.citinewsroom.com/wp-content/uploads/2026/07/anlo-4.jpeg", "Citi Newsroom / Desmond Selase Aggor", "https://www.citinewsroom.com/2026/07/anlo-afiadenyigba-residents-raise-alarm-over-disease-risk-after-floods/"),
      cred("https://www.citinewsroom.com/wp-content/uploads/2026/07/anlo-2.jpeg", "Citi Newsroom / Desmond Selase Aggor", "https://www.citinewsroom.com/2026/07/anlo-afiadenyigba-residents-raise-alarm-over-disease-risk-after-floods/"),
    ],
  },
  {
    id: "AV-GH-WETA-2026", country: "GHA", title: "Weta rice-farming flood impacts", type: "observation",
    dateLabel: "Reported 16 Jul 2026", locations: ["Weta", "Ketu North"],
    summary: "A July report documents submerged rice fields, damaged farm access and warehouses in Weta. Exact onset not established; may overlap the late-June regional episode.",
    photos: [
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/07/image-1938.png", "MyJoyOnline", "https://www.myjoyonline.com/weta-rice-farming-community-hit-by-devastating-floods/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/07/image-1937.png", "MyJoyOnline", "https://www.myjoyonline.com/weta-rice-farming-community-hit-by-devastating-floods/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/07/image-1936.png", "MyJoyOnline", "https://www.myjoyonline.com/weta-rice-farming-community-hit-by-devastating-floods/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/07/image-1939.png", "MyJoyOnline", "https://www.myjoyonline.com/weta-rice-farming-community-hit-by-devastating-floods/"),
    ],
  },
  {
    id: "AV-GH-SAM-202606", country: "GHA", title: "Samreboi and Asankragwa flooding", type: "incident",
    dateLabel: "Mid-Jun 2026 (reported 19 Jun)", locations: ["Samreboi", "Asankragwa", "Wassa Amenfi West"],
    summary: "NADMO, quoted by Citi Newsroom, attributes flooding to the Samre and Tano rivers overflowing after rain; more than 24 buildings reportedly collapsed.",
    photos: [cred("https://www.citinewsroom.com/wp-content/uploads/2026/06/samreboi-flood.webp", "Daily Guide Network via Citi Newsroom", "https://www.citinewsroom.com/2026/06/over-24-buildings-collapse-in-samreboi-asankragwa-floods/")],
  },
  {
    id: "AV-GH-CENT-202606", country: "GHA", title: "Central Region June rain-related disasters", type: "aggregate",
    dateLabel: "Reported 23 Jun 2026", locations: ["Cape Coast", "Amamoma", "Ayensu", "Kwaprow", "Apewosika"],
    summary: "NADMO reporting covers flooding alongside structural collapses, landslides and other rain-related hazards across multiple districts — an all-hazards tally, not a single flood polygon.",
    photos: [cred("https://www.graphic.com.gh/images/2026/June/21/f0bd55be-bae0-4ab4-b5d3-b16bb553b034.jpeg", "Graphic Online / Joana Kumi", "https://www.graphic.com.gh/news/general-news/ghana-news-floods-claim-18-lives-in-central-region-nadmo-orders-evacuation-of-unsafe-buildings.html")],
  },
  {
    id: "AV-GH-NP-20250805", country: "GHA", title: "Nsawam–Pokuase road flooding", type: "incident",
    dateLabel: "5–6 Aug 2025", locations: ["Nsawam–Pokuase road"],
    summary: "A dated Channel One photo gallery documents flooded road sections and stranded vehicles after overnight rainfall. Historical footage from 2025 — never label as 2026.",
    photos: [
      cred("https://www.myjoyonline.com/wp-content/uploads/2025/08/OPOPO-1024x460.jpg", "Channel One TV via MyJoyOnline", "https://www.myjoyonline.com/photos-nsawam-pokuase-road-flooded-after-tuesday-night-rain/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2025/08/OPPOOP-1024x460.jpg", "Channel One TV via MyJoyOnline", "https://www.myjoyonline.com/photos-nsawam-pokuase-road-flooded-after-tuesday-night-rain/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2025/08/opoppo-1-1024x455.jpg", "Channel One TV via MyJoyOnline", "https://www.myjoyonline.com/photos-nsawam-pokuase-road-flooded-after-tuesday-night-rain/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2025/08/oppo-1024x459.jpg", "Channel One TV via MyJoyOnline", "https://www.myjoyonline.com/photos-nsawam-pokuase-road-flooded-after-tuesday-night-rain/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2025/08/pkpl-1024x459.jpg", "Channel One TV via MyJoyOnline", "https://www.myjoyonline.com/photos-nsawam-pokuase-road-flooded-after-tuesday-night-rain/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2025/08/OPO9IPI-1024x455.jpg", "Channel One TV via MyJoyOnline", "https://www.myjoyonline.com/photos-nsawam-pokuase-road-flooded-after-tuesday-night-rain/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2025/08/OPOPOPL-1024x455.jpg", "Channel One TV via MyJoyOnline", "https://www.myjoyonline.com/photos-nsawam-pokuase-road-flooded-after-tuesday-night-rain/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2025/08/OPOPOI.jpg", "Channel One TV via MyJoyOnline", "https://www.myjoyonline.com/photos-nsawam-pokuase-road-flooded-after-tuesday-night-rain/"),
    ],
  },
  {
    id: "AV-GH-WEI-202609", country: "GHA", title: "Weija downstream flood assessment", type: "assessment",
    dateLabel: "Assessed 9 Sep 2026", locations: ["Communities downstream of Weija Dam"],
    summary: "NADMO discusses flood impacts and encroached buffer zones during a September assessment. New flood onset, town list and inundation extent are not established in this article.",
    photos: [],
  },
  {
    id: "AV-GH-ACC-UPDATE-20260824", country: "GHA", title: "Ghana June flooding national impact update", type: "aggregate",
    dateLabel: "National update, 24 Aug 2026", locations: ["Ghana — seven regions"],
    summary: "An August ministerial update revises national impacts to approximately 91,989 affected people and 39 deaths, as of 24 Aug 2026. Regional counts in the article do not fully reconcile with the headline total.",
    photos: [],
  },
  {
    id: "AV-GH-CIRCLE-20260629", country: "GHA", title: "Circle Plastic Market flood and fire aftermath", type: "observation",
    dateLabel: "29 Jun 2026 (aftermath reported Aug)", locations: ["Circle Plastic Market", "Accra"],
    summary: "Later coverage describes traders rebuilding after a flood followed by fire at the market. Fire damage and trader portraits must not be labeled floodwater observations.",
    photos: [],
  },
  {
    id: "AV-GH-BAGRE-2026", country: "GHA", title: "Bagre–White Volta warnings and Daboya monitoring", type: "monitoring",
    dateLabel: "Aug–Sep 2026 (advisories)", locations: ["White Volta basin", "Daboya–Sisipe crossing", "North East Region"],
    summary: "August warning and postponement reports are followed by September monitoring at Daboya. No verified community inundation is established by these advisories — keep as monitoring, not observed flood extent.",
    photos: [
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/09/image-542-1024x576.png", "MyJoyOnline / Deborah Quarcoo", "https://www.myjoyonline.com/nadmo-intensifies-monitoring-in-daboya-as-bagre-dam-spillage-raises-flood-fears/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/09/image-543-1024x576.png", "MyJoyOnline / Deborah Quarcoo", "https://www.myjoyonline.com/nadmo-intensifies-monitoring-in-daboya-as-bagre-dam-spillage-raises-flood-fears/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/09/image-544-1024x577.png", "MyJoyOnline / Deborah Quarcoo", "https://www.myjoyonline.com/nadmo-intensifies-monitoring-in-daboya-as-bagre-dam-spillage-raises-flood-fears/"),
      cred("https://www.myjoyonline.com/wp-content/uploads/2026/09/image-546-1024x577.png", "MyJoyOnline / Deborah Quarcoo", "https://www.myjoyonline.com/nadmo-intensifies-monitoring-in-daboya-as-bagre-dam-spillage-raises-flood-fears/"),
    ],
  },
  {
    id: "AV-CM-WARN-20260916", country: "CMR", title: "Cameroon seasonal flood and landslide warning", type: "warning",
    dateLabel: "Sep–Nov 2026 (seasonal forecast)", locations: ["Cameroon — nine regions cited"],
    summary: "Press reporting relays ONACC seasonal forecasts and MINHDU warnings for flood-prone towns and unstable slopes. A forecast warning, not observed flooding in every named town.",
    photos: [],
  },
];

export const FRESH_TYPE_LABEL: Record<FreshRecordType, string> = {
  incident: "Incident", update: "Update", warning: "Warning", monitoring: "Monitoring",
  observation: "Observation", assessment: "Assessment", aggregate: "Aggregate",
};
export const FRESH_TYPE_COLOR: Record<FreshRecordType, string> = {
  incident: "#EE4B4B", update: "#3b87f0", warning: "#eab364", monitoring: "#eab364",
  observation: "#65b6e9", assessment: "#a9b8c4", aggregate: "#a9b8c4",
};
