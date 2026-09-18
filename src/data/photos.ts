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
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Inondations_%C3%A0_Douala_en_2020.jpg",
    credit: "Score Beethoven / Wikimedia Commons", sourceUrl: "https://commons.wikimedia.org/wiki/File:Inondations_%C3%A0_Douala_en_2020.jpg",
    license: "CC BY-SA 4.0", note: "Douala, 2020-08-23 — floodwater in the city during the 2020 flood period",
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
};

export const communityPhoto = (name: string): CommunityPhoto | undefined => COMMUNITY_PHOTOS[name];

const FALLBACK: Record<string, CommunityPhoto[]> = {
  farNorth: [
    { url: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Innondation_%C3%A0_Yagoua_2022_12.jpg",
      credit: "Bile rene / Wikimedia Commons", sourceUrl: "https://commons.wikimedia.org/wiki/File:Innondation_%C3%A0_Yagoua_2022_12.jpg",
      license: "CC BY-SA 4.0", note: "Representative · Yagoua, 2022-10-07 — flood damage in the Far North" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/5/55/Innondation_%C3%A0_Yagoua_2022_3.jpg",
      credit: "Bile rene / Wikimedia Commons", sourceUrl: "https://commons.wikimedia.org/wiki/File:Innondation_%C3%A0_Yagoua_2022_3.jpg",
      license: "CC BY-SA 4.0", note: "Representative · Yagoua, 2022-10-07 — flood-affected streets and homes" },
  ],
  douala: [
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
