import { create } from "zustand";
import { jarvis } from "../lib/jarvis";
import { VoiceStatus } from "../../shared/types";

interface VoiceControlState {
  status: VoiceStatus | null;
  listening: boolean;
  load: () => Promise<void>;
  setListening: (on: boolean) => Promise<void>;
}

export const useVoice = create<VoiceControlState>((set, get) => ({
  status: null,
  listening: false,

  load: async () => {
    const status = (await jarvis.voice.getStatus()) as VoiceStatus;
    set({ status, listening: Boolean(status.active) });
  },

  setListening: async (on) => {
    if (on) {
      await jarvis.voice.startListening();
    } else {
      await jarvis.voice.stopListening();
    }
    const status = (await jarvis.voice.getStatus()) as VoiceStatus;
    set({ status, listening: Boolean(status.active) });
  }
}));

if (typeof window !== "undefined") {
  jarvis.onEvent("voice:state-change", () => {
    useVoice.getState().load();
  });
}