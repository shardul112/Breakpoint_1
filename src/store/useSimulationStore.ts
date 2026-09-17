import { create } from 'zustand';

export interface TelemetryData {
  status: string;
  current_rps: number;
  total_requests: number;
  active_servers: number;
  max_servers: number;
  hourly_burn_rate: number;
  session_cost: number;
  circuit_breaker_locked: boolean;
  budget_cap: number;
}

interface SimulationStore {
  telemetry: TelemetryData | null;
  history: TelemetryData[];
  fetchTelemetry: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  telemetry: null,
  history: [],
  fetchTelemetry: async () => {
    try {
      const res = await fetch('/api/target/telemetry');
      if (res.ok) {
        const data: TelemetryData = await res.json();
        set((state) => {
          // Keep last 60 data points for the chart
          const newHistory = [...state.history, data].slice(-60);
          return { telemetry: data, history: newHistory };
        });
      }
    } catch (err) {
      console.error('Failed to fetch telemetry', err);
    }
  },
  startPolling: () => {
    if (pollingInterval) return;
    pollingInterval = setInterval(() => {
      get().fetchTelemetry();
    }, 100);
  },
  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  },
}));
