import { create } from "zustand";
import type { Basemap } from "../store";

const SCHEMA = "v1";
const KEY = `avert.preferences.${SCHEMA}`;

export interface Preferences {
  defaultBasemap: Basemap;
  defaultRegionId: string;
  language: "en" | "fr";
  units: "metric" | "imperial";
  motion: "device" | "reduced" | "full";
  rememberView: boolean;
  aiUseContext: boolean;
  aiAutoExplain: boolean;
  notifySimCompleted: boolean;
  notifySimFailures: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  defaultBasemap: "dark",
  defaultRegionId: "lowerVolta",
  language: "en",
  units: "metric",
  motion: "device",
  rememberView: false,
  aiUseContext: true,
  aiAutoExplain: false,
  notifySimCompleted: true,
  notifySimFailures: true,
};

function load(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch { return DEFAULT_PREFERENCES; }
}

interface PreferencesState {
  preferences: Preferences;
  save: (p: Preferences) => void;
  reset: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  preferences: load(),
  save: (p) => { set({ preferences: p }); try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable */ } applyMotionPreference(p.motion); },
  reset: () => { set({ preferences: DEFAULT_PREFERENCES }); try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } applyMotionPreference(DEFAULT_PREFERENCES.motion); },
}));

export function applyMotionPreference(motion: Preferences["motion"]) {
  document.body.classList.toggle("force-reduced-motion", motion === "reduced");
  document.body.classList.toggle("force-full-motion", motion === "full");
}
applyMotionPreference(load().motion);
