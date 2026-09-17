export interface SimulationState {
  isAttacking: boolean;
  targetRps: number;
  currentRps: number;
  totalRequests: number;
  activeServers: number;
  bootingServers: number;
  terminatedServers: number;
  maxServers: number;
  budgetCap: number;
  accumulatedCost: number;
  hourlyBurnRate: number;
  circuitBreakerLocked: boolean;
  lastTickTime: number;
}

const INITIAL_STATE: SimulationState = {
  isAttacking: false,
  targetRps: 0,
  currentRps: 0,
  totalRequests: 0,
  activeServers: 1, // Baseline
  bootingServers: 0,
  terminatedServers: 0,
  maxServers: 10,
  budgetCap: 5.0,
  accumulatedCost: 0,
  hourlyBurnRate: 0.34, // 1 server at $0.34/hr
  circuitBreakerLocked: false,
  lastTickTime: Date.now(),
};

// Next.js API routes are stateless between requests in production, but in development 
// we can use a global variable to persist state for our simulation.
const globalForSimulation = global as unknown as {
  simulationState: SimulationState;
  simulationInterval: NodeJS.Timeout | null;
};

if (!globalForSimulation.simulationState) {
  globalForSimulation.simulationState = { ...INITIAL_STATE };
}

export const getSimulationState = () => globalForSimulation.simulationState;

export const updateSimulationState = (partial: Partial<SimulationState>) => {
  globalForSimulation.simulationState = {
    ...globalForSimulation.simulationState,
    ...partial,
  };
};

export const resetSimulation = () => {
  globalForSimulation.simulationState = { ...INITIAL_STATE, lastTickTime: Date.now() };
};

const SERVER_HOURLY_COST = 360; // Massively accelerated for demo ($0.10/sec/server)
const SERVER_SEC_COST = SERVER_HOURLY_COST / 3600;
const CAPACITY_PER_SERVER = 50;
const TICK_RATE_MS = 100;

const simulationTick = () => {
  const state = globalForSimulation.simulationState;
  const now = Date.now();
  const deltaSec = (now - state.lastTickTime) / 1000;
  state.lastTickTime = now;

  // Step RPS towards target instantly or very rapidly
  if (state.isAttacking) {
    if (state.currentRps < state.targetRps) {
      // Ramp up much faster
      state.currentRps = Math.min(state.targetRps, state.currentRps + 500);
    }
  } else {
    // Ramp down rapidly
    state.currentRps = Math.max(0, state.currentRps - 1000);
  }

  // Increment requests
  const newRequests = Math.floor(state.currentRps * deltaSec);
  state.totalRequests += newRequests;

  // Autoscaling logic
  if (!state.circuitBreakerLocked) {
    const requiredServers = Math.max(1, Math.ceil(state.currentRps / CAPACITY_PER_SERVER));
    const targetActive = Math.min(requiredServers, state.maxServers);
    
    if (targetActive > state.activeServers) {
      // Simulate booting (simplified: just instant for now, but could add delay)
      // We'll jump them to active immediately for this tick, or we could track booting time.
      state.activeServers = targetActive;
    } else if (targetActive < state.activeServers && !state.isAttacking) {
      // Scale down only when not attacking (to prevent flapping)
      state.activeServers = targetActive;
    }
  }

  // Cost calculation
  const currentServersCost = state.activeServers * SERVER_SEC_COST * deltaSec;
  state.accumulatedCost += currentServersCost;
  state.hourlyBurnRate = state.activeServers * SERVER_HOURLY_COST;

  // Circuit breaker auto-trigger
  if (!state.circuitBreakerLocked && state.accumulatedCost >= state.budgetCap) {
      // It tripped!
      state.circuitBreakerLocked = true;
      // Note: Full circuit breaker action (scale down) might be called by the frontend or done here.
  }
};

// Start the ticker if not already running
if (!globalForSimulation.simulationInterval) {
  globalForSimulation.simulationInterval = setInterval(simulationTick, TICK_RATE_MS);
}
