import { create } from "zustand";
import { jarvis } from "../lib/jarvis";
import { Task } from "../../shared/types";

interface TasksState {
  tasks: Task[];
  loaded: boolean;
  load: () => Promise<void>;
  create: (title: string, dueAt?: number | null) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  loaded: false,
  load: async () => {
    const tasks = (await jarvis.tasks.list()) as Task[];
    set({ tasks, loaded: true });
  },
  create: async (title, dueAt = null) => {
    await jarvis.tasks.create({ title, dueAt, source: "manual", completed: false });
    await get().load();
  },
  toggle: async (id) => {
    const t = get().tasks.find((x) => x.id === id);
    if (!t) return;
    await jarvis.tasks.update(id, { completed: !t.completed });
    await get().load();
  },
  remove: async (id) => {
    await jarvis.tasks.remove(id);
    await get().load();
  }
}));
