# Keep Avert’s evidence current

This is a researched ingestion design, not a background service already running.

## Feeds tested on 19 September 2026

- [MyJoyOnline](https://www.myjoyonline.com/feed/): valid RSS XML, 50 current entries.
- [Journal du Cameroun](https://fr.journalducameroun.com/feed/): valid RSS XML, 10 current entries.
- [Africanews](https://www.africanews.com/feed/rss?themes=news): valid RSS XML, 50 current entries.
- [Citi Newsroom attempted feed](https://www.citinewsroom.com/feed/): not a working RSS feed in this check; returned HTML.

## Country source mix

Ghana: NADMO (`https://www.nadmo.gov.gh/`), Ghana Meteorological Agency (`https://www.meteo.gov.gh/`), Ghana News Agency, MyJoyOnline, Graphic Online, Citi Newsroom/Channel One, TV3/3News, VRA/SONABEL/WRC releases where relevant. Use official agencies for warnings and measurements, local reporting for community observations and photo leads. The fresh articles in this pack establish working local-news examples; not every publisher API/feed is verified.

Cameroon: ONACC (`https://www.onacc.cm/`), municipal Douala/CUD notices, Cameroon Tribune, CRTV, Journal du Cameroun, Actu Cameroun, Africanews, Cameroon Red Cross/IFRC and OCHA reports. Some sites blocked automated reads; do not bypass authentication or anti-bot controls. Use another public source and mark the coverage gap.

International corroboration: Copernicus GloFAS event summaries, IFRC GO, ReliefWeb and UN agency situation reports. A Copernicus news photo is not a Copernicus flood polygon. ReliefWeb report-page access was unreliable in this session; an indexed Douala report dated Sep 17/posted Sep 18 remains a primary-source retrieval lead, not an ingested report.

## Suggested ingestion pipeline

1. Fetch verified feeds every 30–60 minutes within publisher limits; respect cache headers, conditional requests and backoff on 429. Initial backfill should be bounded by date and country.
2. Filter English and French: flood/inundation/overflow/dam spillage/flash flood, inondation/crue/débordement/lâcher/éboulement/glissement; combine with country and locality gazetteers. Cameroon articles about Nepal are not Cameroon flood incidents.
3. Keep publisher URL, article ID, publication/updated timestamp and retrieval time. Prefer original reporting; syndicated copies enrich corroboration without multiplying events.
4. Extract candidate places, occurrence dates, hazards, metrics and photo captions. Preserve nulls. AI outputs need evidence anchors and schema validation.
5. Match the candidate to an event by country, locality, cause and date window. Treat follow-ups as observations. Flag competing dates for review.
6. Resolve localities using authoritative boundaries/gazetteers. Track town/district/region precision. A city centroid is a navigation point, not a camera point or flooded polygon.
7. Queue media with source caption, credit and license. Deduplicate normalized URLs, image bytes and perceptual similarity; review crops, collages, watermarks and cross-site copies.
8. Publish only reviewed evidence. Keep correction/version history and withdrawn claims. Public warnings require approved sources and an authorised workflow.

## Freshness fields

Store `published_at`, `updated_at`, `occurred_start`, `occurred_end`, `capture_date`, `retrieved_at`, `last_checked_at`, `verification_status`, `source_id`, `location_precision`, `rights_status`, and `incident_id` separately. Show “no recent report found” instead of “no flood” when coverage is incomplete.

## Coverage of this research

Searched both countries through the cutoff; followed local-news related stories and on-site search, read article bodies, checked registries, extracted actual media URLs and verified image fetches where possible. This is not an exhaustive national event inventory. No June image is relabelled September to make the dataset appear current.
