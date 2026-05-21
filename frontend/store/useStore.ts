import { create } from "zustand";

interface Memory {
  id: number;
  content: string;
  type: string;
  emotional_weight: number;
  importance_score: number;
  created_at: string;
  reinforcement_count: number;
  modalities: any[];
}

interface AgentLog {
  agent: string;
  message: string;
}

interface GraphData {
  nodes: Array<{ id: string; label: string; type: string; importance: number }>;
  links: Array<{ source: string; target: string; type: string; weight: number }>;
}

interface OSState {
  token: string | null;
  user: any | null;
  memories: Memory[];
  searchResults: any[];
  timelineMemories: any[];
  graphData: GraphData;
  activeLogs: AgentLog[];
  isStreaming: boolean;
  isLoading: boolean;
  activeView: string;
  setToken: (token: string | null) => void;
  setUser: (user: any) => void;
  setActiveView: (view: string) => void;
  fetchMemories: () => Promise<void>;
  fetchGraph: () => Promise<void>;
  searchMemories: (query: string) => Promise<void>;
  fetchTimeline: (query: string) => Promise<void>;
  runAgentQuery: (query: string) => Promise<string>;
  compressMemories: () => Promise<void>;
  deleteMemory: (id: number) => Promise<void>;
  addMemoryDirectly: (content: string, type: string) => Promise<void>;
}

const BACKEND_URL = "http://localhost:8000/api/v1";

export const useStore = create<OSState>((set, get) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: null,
  memories: [],
  searchResults: [],
  timelineMemories: [],
  graphData: { nodes: [], links: [] },
  activeLogs: [],
  isStreaming: false,
  isLoading: false,
  activeView: "landing",

  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    set({ token });
  },
  
  setUser: (user) => set({ user }),
  setActiveView: (view) => set({ activeView: view }),

  fetchMemories: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${BACKEND_URL}/memory/`, {
        headers: get().token ? { Authorization: `Bearer ${get().token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        set({ memories: data });
      }
    } catch (err) {
      console.error("Failed to fetch memories:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGraph: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/memory/graph`, {
        headers: get().token ? { Authorization: `Bearer ${get().token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        set({ graphData: data });
      }
    } catch (err) {
      console.error("Failed to fetch D3 memory graph:", err);
    }
  },

  searchMemories: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/memory/search?query=${encodeURIComponent(query)}`, {
        headers: get().token ? { Authorization: `Bearer ${get().token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        set({ searchResults: data.contexts || [] });
      }
    } catch (err) {
      console.error("Failed semantic search:", err);
    }
  },

  fetchTimeline: async (query) => {
    try {
      const response = await fetch(`${BACKEND_URL}/memory/timeline?query=${encodeURIComponent(query)}`, {
        headers: get().token ? { Authorization: `Bearer ${get().token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        set({ timelineMemories: data.timeline || [] });
      }
    } catch (err) {
      console.error("Failed temporal timeline fetch:", err);
    }
  },

  runAgentQuery: async (query) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${BACKEND_URL}/agents/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(get().token ? { Authorization: `Bearer ${get().token}` } : {}),
        },
        body: JSON.stringify({ query }),
      });
      if (response.ok) {
        const data = await response.json();
        set({ activeLogs: data.execution_logs });
        get().fetchMemories();
        get().fetchGraph();
        return data.response;
      }
      return "Cognitive execution failure.";
    } catch (err) {
      console.error("Failed agent workflow run:", err);
      return "Network connection error with LangGraph API.";
    } finally {
      set({ isLoading: false });
    }
  },

  compressMemories: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/memory/compress`, {
        method: "POST",
        headers: get().token ? { Authorization: `Bearer ${get().token}` } : {},
      });
      if (response.ok) {
        get().fetchMemories();
        get().fetchGraph();
      }
    } catch (err) {
      console.error("Failed manual memory consolidation:", err);
    }
  },

  deleteMemory: async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/memory/${id}`, {
        method: "DELETE",
        headers: get().token ? { Authorization: `Bearer ${get().token}` } : {},
      });
      if (response.ok) {
        get().fetchMemories();
        get().fetchGraph();
      }
    } catch (err) {
      console.error("Failed memory deletion:", err);
    }
  },

  addMemoryDirectly: async (content, type) => {
    try {
      const response = await fetch(`${BACKEND_URL}/memory/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(get().token ? { Authorization: `Bearer ${get().token}` } : {}),
        },
        body: JSON.stringify({ content, type, importance_score: 8.0 }),
      });
      if (response.ok) {
        get().fetchMemories();
        get().fetchGraph();
      }
    } catch (err) {
      console.error("Failed direct memory write:", err);
    }
  }
}));
