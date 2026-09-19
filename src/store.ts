import { create } from "zustand";
import { DEFAULT_EVENT, getEvent } from "./data/flood";
import { usePreferencesStore } from "./stores/preferencesStore";

const LAST_VIEW_KEY = "avert.lastView.v1";
function loadLastView(): { eventId: string; mode: Mode } | null {
  if (!usePreferencesStore.getState().preferences.rememberView) return null;
  try {
    const raw = localStorage.getItem(LAST_VIEW_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { eventId: string; mode: Mode };
    getEvent(v.eventId); // throws if the id is no longer valid — fall back to the default rather than crash
    return v;
  } catch { return null; }
}

export type Basemap = "streets" | "satellite" | "dark";
export type Mode = "observed" | "forecast";

interface State {
  eventId: string; // which historical event is loaded
  selectedId: string | null; // community id
  stepIndex: number; // inundation timeline within the event
  playing: boolean;
  basemap: Basemap;
  mode: Mode;
  compareOpen: boolean;
  sourcesOpen: boolean;
  historyOpen: boolean;
  demoRunning: boolean;
  askAvertOpen: boolean;
  modelOpen: boolean;
  setEvent: (id: string) => void;
  selectCommunity: (id: string | null) => void;
  setStep: (i: number) => void;
  setPlaying: (p: boolean) => void;
  setBasemap: (b: Basemap) => void;
  setMode: (m: Mode) => void;
  setCompareOpen: (o: boolean) => void;
  setSourcesOpen: (o: boolean) => void;
  setHistoryOpen: (o: boolean) => void;
  setDemoRunning: (r: boolean) => void;
  setAskAvertOpen: (o: boolean) => void;
  setModelOpen: (o: boolean) => void;
}

const lastStep = (eventId: string) => getEvent(eventId).steps.length - 1;
const remembered = loadLastView();
const initialEventId = remembered?.eventId ?? DEFAULT_EVENT;

export const useStore = create<State>((set) => ({
  eventId: initialEventId,
  selectedId: null,
  stepIndex: lastStep(initialEventId), // open at peak; replay from the timeline
  playing: false,
  basemap: "dark", // calm, low-clutter default — bright street tiles fight the data overlays
  mode: remembered?.mode ?? "observed",
  compareOpen: false,
  sourcesOpen: false,
  historyOpen: false,
  demoRunning: false,
  askAvertOpen: false,
  modelOpen: false,
  setEvent: (eventId) => set({ eventId, stepIndex: lastStep(eventId), selectedId: null, playing: false, historyOpen: false }),
  selectCommunity: (selectedId) => set({ selectedId, compareOpen: false }),
  setStep: (stepIndex) => set({ stepIndex }),
  setPlaying: (playing) => set({ playing }),
  setBasemap: (basemap) => set({ basemap }),
  setMode: (mode) => set({ mode }),
  setCompareOpen: (compareOpen) => set({ compareOpen }),
  setSourcesOpen: (sourcesOpen) => set({ sourcesOpen }),
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  setDemoRunning: (demoRunning: boolean) => set({ demoRunning }),
  setAskAvertOpen: (askAvertOpen) => set({ askAvertOpen }),
  setModelOpen: (modelOpen) => set({ modelOpen }),
}));

// Preferences > "Remember last-viewed region and mode": persist on every relevant change,
// gated live on the current preference so toggling it off stops writing immediately.
useStore.subscribe((state, prev) => {
  if (state.eventId === prev.eventId && state.mode === prev.mode) return;
  if (!usePreferencesStore.getState().preferences.rememberView) return;
  try { localStorage.setItem(LAST_VIEW_KEY, JSON.stringify({ eventId: state.eventId, mode: state.mode })); } catch { /* storage unavailable */ }
});
