import { create } from "zustand";
import { jarvis } from "../lib/jarvis";

interface ScreenState {
  prompt: string;
  result: string;
  capturing: boolean;
  error: string | null;
  setPrompt: (p: string) => void;
  capture: (prompt?: string) => Promise<void>;
}

export const useScreen = create<ScreenState>((set, get) => ({
  prompt: "",
  result: "",
  capturing: false,
  error: null,

  setPrompt: (prompt) => set({ prompt }),

  capture: async (prompt?: string) => {
    const text = (prompt ?? get().prompt).trim() || "Summarize what is currently on screen.";
    set({ prompt: text, capturing: true, error: null });
    try {
      const result = (await jarvis.screen.captureAndDescribe(text)) as string;
      set({ result, capturing: false });
    } catch (err) {
      set({
        capturing: false,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }
}));