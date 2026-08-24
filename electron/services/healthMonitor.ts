import { AdapterState } from "../../shared/types";

type HealthListener = (states: AdapterState[]) => void;

const states = new Map<string, AdapterState>();
const listeners = new Set<HealthListener>();

function emit() {
  const snapshot = [...states.values()];
  listeners.forEach((l) => l(snapshot));
}

export const healthMonitor = {
  register(initial: AdapterState) {
    states.set(initial.id, initial);
  },

  update(id: string, patch: Partial<AdapterState>) {
    const current = states.get(id);
    if (!current) return;
    states.set(id, { ...current, ...patch });
    emit();
  },

  snapshot(): AdapterState[] {
    return [...states.values()];
  },

  subscribe(cb: HealthListener): () => void {
    listeners.add(cb);
    cb(this.snapshot());
    return () => listeners.delete(cb);
  }
};
