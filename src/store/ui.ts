import { create } from "zustand";

export type View =
  | "briefing"
  | "tasks"
  | "chat"
  | "recall"
  | "screen"
  | "integrations"
  | "focus"
  | "profile";

interface UIState {
  view: View;
  setView: (v: View) => void;
  paletteOpen: boolean;
  paletteQuery: string;
  openPalette: () => void;
  closePalette: () => void;
  setPaletteQuery: (q: string) => void;
}

export const useUI = create<UIState>((set) => ({
  view: "briefing",
  setView: (view) => set({ view }),
  paletteOpen: false,
  paletteQuery: "",
  openPalette: () => set({ paletteOpen: true, paletteQuery: "" }),
  closePalette: () => set({ paletteOpen: false }),
  setPaletteQuery: (query) => set({ paletteQuery: query })
}));