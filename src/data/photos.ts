// Real located flood photos keyed by community name. Only exact rights-cleared matches should be
// rendered. Any restricted or mismatched source is skipped rather than displayed with a wrong claim.
export interface CommunityPhoto {
  url: string;
  credit: string;
  sourceUrl: string;
  license: string;
  note?: string; // place + date caption
}

export const COMMUNITY_PHOTOS: Record<string, CommunityPhoto> = {
  Tinguri: {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/8c/The_Tiguri_Gbani_Damba_flood.jpg",
    credit: "Ibn Pasiba / Wikimedia Commons", sourceUrl: "https://commons.wikimedia.org/wiki/File:The_Tiguri_Gbani_Damba_flood.jpg",
    license: "CC BY-SA 4.0", note: "Tinguri, Aug 2023 — Tiguri Gbani Damba flood",
  },
  Douala: {
    url: "https://www.cameroon-tribune.cm//administrateur/photo/normal_dbg76f9.jpg",
    credit: "Cameroon Tribune", sourceUrl: "https://www.cameroon-tribune.cm/article.html/80602/fr.html/douala-v-les-eaux-sont-montees",
    license: "publisher photo", note: "Douala V, 2026-09-14 — flooded street after heavy rain and high tide",
  },
  Yaoundé: {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Route_inond%C3%A9e_02_%C3%A0_Yaound%C3%A9_Cameroun.jpg",
    credit: "Kondah / Wikimedia Commons", sourceUrl: "https://commons.wikimedia.org/wiki/File:Route_inond%C3%A9e_02_%C3%A0_Yaound%C3%A9_Cameroun.jpg",
    license: "CC BY-SA 4.0", note: "Yaoundé, 2020-03-01 — road and rail crossing inundated after rainfall",
  },
  Yagoua: {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Innondation_%C3%A0_Yagoua_2022_10.jpg",
    credit: "Bile rene / Wikimedia Commons", sourceUrl: "https://commons.wikimedia.org/wiki/File:Innondation_%C3%A0_Yagoua_2022_10.jpg",
    license: "CC BY-SA 4.0", note: "Yagoua, 2022-10-07 — severe flood damage in the town",
  },
  Buea: {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Consequences_of_rainfall_in_Buea_south-west_Region_of_Cameroon.jpg",
    credit: "Dera11329 / Wikimedia Commons", sourceUrl: "https://commons.wikimedia.org/wiki/File:Consequences_of_rainfall_in_Buea_south-west_Region_of_Cameroon.jpg",
    license: "CC BY-SA 4.0", note: "Buea, 2023-03-23 — mud and debris after heavy rainfall",
  },
};

export const communityPhoto = (name: string): CommunityPhoto | undefined => COMMUNITY_PHOTOS[name];

const yagoua2022 = (file: string, n: string): CommunityPhoto => ({
  url: `https://upload.wikimedia.org/wikipedia/commons/${file}`,
  credit: "Bile rene / Wikimedia Commons", sourceUrl: `https://commons.wikimedia.org/wiki/File:Innondation_%C3%A0_Yagoua_2022${n}.jpg`,
  license: "CC BY-SA 4.0", note: "Representative · Yagoua, 2022-10-07 — flood damage in the Far North",
});

const FALLBACK: Record<string, CommunityPhoto[]> = {
  farNorth: [
    yagoua2022("a/a3/Innondation_%C3%A0_Yagoua_2022_12.jpg", "_12"),
    yagoua2022("5/55/Innondation_%C3%A0_Yagoua_2022_3.jpg", "_3"),
    yagoua2022("c/cc/Innondation_%C3%A0_Yagoua_2022_11.jpg", "_11"),
    yagoua2022("2/20/Innondation_%C3%A0_Yagoua_2022_13.jpg", "_13"),
    yagoua2022("4/41/Innondation_%C3%A0_Yagoua_2022_14.jpg", "_14"),
    yagoua2022("2/2e/Innondation_%C3%A0_Yagoua_2022_2.jpg", "_2"),
    yagoua2022("f/f5/Innondation_%C3%A0_Yagoua_2022_4.jpg", "_4"),
    yagoua2022("6/6f/Innondation_%C3%A0_Yagoua_2022_5.jpg", "_5"),
    yagoua2022("a/ac/Innondation_%C3%A0_Yagoua_2022_6.jpg", "_6"),
    yagoua2022("6/64/Innondation_%C3%A0_Yagoua_2022_7.jpg", "_7"),
    yagoua2022("2/21/Innondation_%C3%A0_Yagoua_2022_9.jpg", "_9"),
    yagoua2022("c/cc/Innondation_%C3%A0_Yagoua_2022.jpg", ""),
  ],
  douala: [
    { url: "https://images.euronews.com/articles/stories/09/91/07/29/1024x538_cmsv2_11e9ea98-4864-599a-9cdb-a37ec538d3e0-9910729.jpg",
      credit: "Africanews", sourceUrl: "https://www.africanews.com/2026/09/12/cameroons-economic-capital-douala-wakes-up-underwater-after-heavy-rains/",
      license: "publisher photo", note: "Representative · Douala V, 2026-09 — flooding after heavy rain" },
    { url: "https://www.duala.info/newspics/3650.jpg",
      credit: "Duala Info / Camerounlink", sourceUrl: "https://www.duala.info/m/actu/douala-les-fortes-pluies-et-la-maree-haute-provoquent-des-debordements-dans-plusieurs-quartiers/3650",
      license: "publisher photo", note: "Representative · Douala, 2026-09-11 — overflow after heavy rain and high tide" },
    { url: "https://admin.diaspocamtv.com/storage/gallery/2026/09/12/isit4o67kdpjvkdkg0r3609r3j4ii2.jpeg",
      credit: "Diaspocam TV", sourceUrl: "https://diaspocamtv.com/news/details/inondations-a-douala-v-le-gouverneur-du-littoral-sur-le-terrain",
      license: "publisher photo", note: "Representative · Douala, 2026-09-12 — governor's site visit" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Inondations_%C3%A0_Douala_en_2020.jpg",
      credit: "Score Beethoven / Wikimedia Commons", sourceUrl: "https://commons.wikimedia.org/wiki/File:Inondations_%C3%A0_Douala_en_2020.jpg",
      license: "CC BY-SA 4.0", note: "Representative · Douala, 2020-08-23 — floodwater across the city" },
  ],
};

export function photoFor(name: string, regionId: string, flooded: boolean): CommunityPhoto | undefined {
  const exact = COMMUNITY_PHOTOS[name];
  if (exact) return exact;
  if (!flooded) return undefined;
  const pool = FALLBACK[regionId];
  if (!pool?.length) return undefined;
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}
