import { create } from "zustand";
import { jarvis } from "../lib/jarvis";
import { AdapterState } from "../../shared/types";

interface IntegrationsState {
  adapters: AdapterState[];
  load: () => Promise<void>;
  reconnect: (id: string) => Promise<void>;
  authorize: (id: string) => Promise<void>;
}

export const useIntegrations = create<IntegrationsState>((set) => ({
  adapters: [],
  load: async () => {
    const adapters = await jarvis.integrations.list();
    set({ adapters });
  },
  reconnect: async (id) => {
    await jarvis.integrations.reconnect(id);
    const adapters = await jarvis.integrations.list();
    set({ adapters });
  },
  authorize: async (id) => {
    await jarvis.integrations.authorize(id);
    const adapters = await jarvis.integrations.list();
    set({ adapters });
  }
}));
