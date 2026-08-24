import { create } from "zustand";
import { jarvis } from "../lib/jarvis";
import { ChatMessage, IntentResult } from "../../shared/types";

interface ChatState {
  messages: ChatMessage[];
  thinking: boolean;
  load: () => Promise<void>;
  send: (text: string) => Promise<IntentResult | null>;
}

export const useChat = create<ChatState>((set, get) => ({
  messages: [],
  thinking: false,
  load: async () => {
    const raw = (await jarvis.chat.history()) as ChatMessage[];
    set({ messages: raw });
  },
  send: async (text) => {
    if (!text.trim()) return null;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      createdAt: Date.now()
    };
    set({ messages: [...get().messages, userMsg], thinking: true });
    const res = await jarvis.chat.send(text);
    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: res.answer,
      intent: res.intent,
      createdAt: Date.now()
    };
    set({ messages: [...get().messages, assistantMsg], thinking: false });
    return res;
  }
}));
