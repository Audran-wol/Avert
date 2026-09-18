import { getRegion } from "../data/regions";

export interface RainSnapshot {
  next72mm: number;
  past7mm: number;
  rainPressure: number;
  issuedAt: string;
}

const cache = new Map<string, RainSnapshot>();

export function getCachedRainSnapshot(regionId: string): RainSnapshot | undefined {
  return cache.get(regionId);
}

export function defaultRainSnapshot(): RainSnapshot {
  return { next72mm: 38, past7mm: 26, rainPressure: 0.53, issuedAt: new Date().toISOString() };
}

export async function fetchRainSnapshot(regionId: string): Promise<RainSnapshot> {
  const region = getRegion(regionId);
  const [lng, lat] = region.view.center;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum&past_days=7&forecast_days=3&timezone=GMT`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo fetch failed for ${regionId}: ${res.status}`);
  }

  const data = (await res.json()) as {
    daily?: {
      time?: string[];
      precipitation_sum?: Array<number | null>;
    };
  };

  const rain = (data.daily?.precipitation_sum ?? []).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const next72mm = rain.slice(-3).reduce((sum, value) => sum + value, 0);
  const past7mm = rain.slice(0, Math.min(7, rain.length)).reduce((sum, value) => sum + value, 0);
  const snapshot: RainSnapshot = {
    next72mm,
    past7mm,
    rainPressure: Math.min(1, (next72mm + past7mm) / 120),
    issuedAt: new Date().toISOString(),
  };

  cache.set(regionId, snapshot);
  return snapshot;
}
