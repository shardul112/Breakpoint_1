import { NextResponse } from 'next/server';
import { getSimulationState } from '@/lib/simulation';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = getSimulationState();
  
  return NextResponse.json({
    status: state.circuitBreakerLocked ? 'CIRCUIT BREAKER LOCKED' : (state.isAttacking ? 'SCALING UNDER LOAD' : 'HEALTHY'),
    current_rps: state.currentRps,
    total_requests: state.totalRequests,
    active_servers: state.activeServers,
    max_servers: state.maxServers,
    hourly_burn_rate: state.hourlyBurnRate,
    session_cost: state.accumulatedCost,
    circuit_breaker_locked: state.circuitBreakerLocked,
    budget_cap: state.budgetCap
  });
}
