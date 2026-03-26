import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Message {
  id: string;
  sender: "me" | "them";
  type: "message" | "timestamp" | "call";
  text: string;
}

export interface Settings {
  contactName: string;
  avatarUrl: string | null;
  statusBarTime: string;
  notificationBadge: number;
  readReceipt: "none" | "delivered" | "read";
  darkMode: boolean;
  greenBubbles: boolean;
  autoplay: boolean;
  messageDelay: number;
  typingDuration: number;
  callBannerDuration: number;
  playbackSpeed: number;
}

const DEFAULT_SETTINGS: Settings = {
  contactName: "Sarah",
  avatarUrl: null,
  statusBarTime: "9:41",
  notificationBadge: 0,
  readReceipt: "delivered",
  darkMode: true,
  greenBubbles: false,
  autoplay: false,
  messageDelay: 800,
  typingDuration: 1200,
  callBannerDuration: 2000,
  playbackSpeed: 1,
};

const PRESETS: Record<string, Message[]> = {
  "dating-drama": [
    {
      id: "p1",
      sender: "me",
      type: "message",
      text: "hey are you coming tonight?",
    },
    { id: "p2", sender: "them", type: "message", text: "idk maybe" },
    {
      id: "p3",
      sender: "me",
      type: "message",
      text: "what do you mean maybe, we made plans 🙄",
    },
    { id: "p4", sender: "them", type: "message", text: "something came up" },
    {
      id: "p5",
      sender: "me",
      type: "message",
      text: "something or someone 😒",
    },
    { id: "p6", sender: "them", type: "message", text: "don't start" },
    {
      id: "p7",
      sender: "me",
      type: "message",
      text: "you've been so distant this week",
    },
    { id: "p8", sender: "them", type: "message", text: "i've just been busy" },
    {
      id: "p9",
      sender: "me",
      type: "message",
      text: "too busy to text back for 6 hours?",
    },
    { id: "p10", sender: "them", type: "message", text: "yes actually" },
    {
      id: "p11",
      sender: "me",
      type: "message",
      text: "you know what, this is getting old",
    },
    { id: "p12", sender: "them", type: "message", text: "fine then" },
  ],
  "caught-cheating": [
    { id: "c1", sender: "them", type: "message", text: "hey babe ❤️" },
    { id: "c2", sender: "me", type: "message", text: "hey... can we talk" },
    { id: "c3", sender: "them", type: "message", text: "sure what's up" },
    {
      id: "c4",
      sender: "me",
      type: "message",
      text: "i found some texts on your phone",
    },
    {
      id: "c5",
      sender: "them",
      type: "message",
      text: "what?? you went through my phone?",
    },
    {
      id: "c6",
      sender: "me",
      type: "message",
      text: "i saw it unlock with a notification. who is 'J'",
    },
    {
      id: "c7",
      sender: "them",
      type: "message",
      text: "just a coworker calm down",
    },
    {
      id: "c8",
      sender: "me",
      type: "message",
      text: '"can\'t stop thinking about last night" is just a coworker??',
    },
    {
      id: "c9",
      sender: "them",
      type: "message",
      text: "it's not what it looks like",
    },
    {
      id: "c10",
      sender: "me",
      type: "message",
      text: "are you serious right now",
    },
    {
      id: "c11",
      sender: "them",
      type: "message",
      text: "please let me explain",
    },
    {
      id: "c12",
      sender: "me",
      type: "message",
      text: "there's nothing to explain. we're done.",
    },
  ],
  "prank-script": [
    { id: "pr1", sender: "me", type: "message", text: "bro are you home" },
    { id: "pr2", sender: "them", type: "message", text: "yeah why" },
    {
      id: "pr3",
      sender: "me",
      type: "message",
      text: "look outside your window RIGHT NOW",
    },
    { id: "pr4", sender: "them", type: "message", text: "what why" },
    { id: "pr5", sender: "me", type: "message", text: "LOOK" },
    {
      id: "pr6",
      sender: "them",
      type: "message",
      text: "ok i'm looking... i don't see anything",
    },
    { id: "pr7", sender: "me", type: "message", text: "other window" },
    {
      id: "pr8",
      sender: "them",
      type: "message",
      text: "dude there's nothing there wtf",
    },
    { id: "pr9", sender: "me", type: "message", text: "got you 😂" },
    { id: "pr10", sender: "them", type: "message", text: "i hate you so much" },
    {
      id: "pr11",
      sender: "me",
      type: "message",
      text: "your face must have been priceless lmao",
    },
    {
      id: "pr12",
      sender: "them",
      type: "message",
      text: "never texting you again",
    },
  ],
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

interface StudioStore {
  messages: Message[];
  settings: Settings;
  visibleCount: number;
  isPlaying: boolean;

  addMessage: (
    sender: "me" | "them",
    type?: "message" | "timestamp" | "call",
  ) => void;
  updateMessage: (id: string, text: string) => void;
  deleteMessage: (id: string) => void;
  duplicateMessage: (id: string) => void;
  reorderMessages: (oldIndex: number, newIndex: number) => void;
  toggleSender: (id: string) => void;
  setMessages: (messages: Message[]) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setVisibleCount: (count: number) => void;
  setIsPlaying: (playing: boolean) => void;
  loadPreset: (preset: string) => void;
  saveProject: (name: string) => void;
  loadProject: (data: { messages: Message[]; settings: Settings }) => void;
  getSavedProjects: () => Array<{
    name: string;
    data: { messages: Message[]; settings: Settings };
  }>;
  deleteProject: (name: string) => void;
}

export const useStudioStore = create<StudioStore>()(
  persist(
    (set, get) => ({
      messages: PRESETS["dating-drama"],
      settings: DEFAULT_SETTINGS,
      visibleCount: 0,
      isPlaying: false,

      addMessage: (sender, type = "message") =>
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: genId(),
              sender,
              type,
              text:
                type === "timestamp"
                  ? new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : type === "call"
                    ? "FaceTime Audio · 3:42"
                    : "",
            },
          ],
        })),

      updateMessage: (id, text) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, text } : m)),
        })),

      deleteMessage: (id) =>
        set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

      duplicateMessage: (id) =>
        set((s) => {
          const idx = s.messages.findIndex((m) => m.id === id);
          if (idx === -1) return s;
          const copy = { ...s.messages[idx], id: genId() };
          const next = [...s.messages];
          next.splice(idx + 1, 0, copy);
          return { messages: next };
        }),

      reorderMessages: (oldIndex, newIndex) =>
        set((s) => {
          const next = [...s.messages];
          const [removed] = next.splice(oldIndex, 1);
          next.splice(newIndex, 0, removed);
          return { messages: next };
        }),

      toggleSender: (id) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id
              ? { ...m, sender: m.sender === "me" ? "them" : "me" }
              : m,
          ),
        })),

      setMessages: (messages) => set({ messages }),

      updateSettings: (settings) =>
        set((s) => ({ settings: { ...s.settings, ...settings } })),

      setVisibleCount: (count) => set({ visibleCount: count }),

      setIsPlaying: (playing) => set({ isPlaying: playing }),

      loadPreset: (preset) => {
        const messages = PRESETS[preset];
        if (messages) set({ messages, visibleCount: 0, isPlaying: false });
      },

      saveProject: (name) => {
        const { messages, settings } = get();
        localStorage.setItem(
          `imessage_project_${name}`,
          JSON.stringify({ messages, settings, savedAt: Date.now() }),
        );
      },

      loadProject: (data) => {
        set({
          messages: data.messages,
          settings: data.settings,
          visibleCount: 0,
          isPlaying: false,
        });
      },

      getSavedProjects: () => {
        const projects: Array<{
          name: string;
          data: { messages: Message[]; settings: Settings };
        }> = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("imessage_project_")) {
            const name = key.replace("imessage_project_", "");
            try {
              const data = JSON.parse(localStorage.getItem(key) || "");
              projects.push({ name, data });
            } catch {
              // skip
            }
          }
        }
        return projects;
      },

      deleteProject: (name) => {
        localStorage.removeItem(`imessage_project_${name}`);
      },
    }),
    {
      name: "imessage_autosave",
      partialize: (state) => ({
        messages: state.messages,
        settings: state.settings,
      }),
    },
  ),
);
