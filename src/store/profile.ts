import { create } from "zustand";
import { jarvis } from "../lib/jarvis";
import { UserProfile } from "../../shared/types";

interface ProfileState {
  profile: UserProfile | null;
  load: () => Promise<void>;
  set: (patch: Partial<UserProfile>) => Promise<void>;
  deleteFact: (key: string) => Promise<void>;
}

export const useProfile = create<ProfileState>((set, get) => ({
  profile: null,
  load: async () => {
    const profile = (await jarvis.profile.get()) as UserProfile;
    set({ profile });
  },
  set: async (patch) => {
    const profile = (await jarvis.profile.set(patch)) as UserProfile;
    set({ profile });
  },
  deleteFact: async (key) => {
    await jarvis.profile.deleteFact(key);
    const profile = (await jarvis.profile.get()) as UserProfile;
    set({ profile });
  }
}));
