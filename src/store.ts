import { create } from "zustand";
import { DEFAULT_EVENT, getEvent } from "./data/flood";

export type Basemap = "streets" | "satellite" | "dark";
export type Mode = "observed" | "forecast";

interface State {
  eventId: string; // which historical event is loaded
  selectedId: string | null; // community id
  stepIndex: number; // inundation timeline within the event
  playing: boolean;
  basemap: Basemap;
  mode: Mode;
  panelOpen: boolean;
  compareOpen: boolean;
  sourcesOpen: boolean;
  historyOpen: boolean;
  demoRunning: boolean;
  setEvent: (id: string) => void;
  selectCommunity: (id: string | null) => void;
  setStep: (i: number) => void;
  setPlaying: (p: boolean) => void;
  setBasemap: (b: Basemap) => void;
  setMode: (m: Mode) => void;
  setPanelOpen: (o: boolean) => void;
  setCompareOpen: (o: boolean) => void;
  setSourcesOpen: (o: boolean) => void;
  setHistoryOpen: (o: boolean) => void;
  setDemoRunning: (r: boolean) => void;
}

const lastStep = (eventId: string) => getEvent(eventId).steps.length - 1;

export const useStore = create<State>((set) => ({
  eventId: DEFAULT_EVENT,
  selectedId: null,
  stepIndex: lastStep(DEFAULT_EVENT), // open at peak; replay from the timeline
  playing: false,
  basemap: "streets",
  mode: "observed",
  panelOpen: true,
  compareOpen: false,
  sourcesOpen: false,
  historyOpen: false,
  demoRunning: false,
  setEvent: (eventId) => set({ eventId, stepIndex: lastStep(eventId), selectedId: null, playing: false, historyOpen: false }),
  selectCommunity: (selectedId) => set({ selectedId, compareOpen: false }),
  setStep: (stepIndex) => set({ stepIndex }),
  setPlaying: (playing) => set({ playing }),
  setBasemap: (basemap) => set({ basemap }),
  setMode: (mode) => set({ mode }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setCompareOpen: (compareOpen) => set({ compareOpen }),
  setSourcesOpen: (sourcesOpen) => set({ sourcesOpen }),
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  setDemoRunning: (demoRunning: boolean) => set({ demoRunning }),
}));
