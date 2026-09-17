import { NextResponse } from 'next/server';
import { getSimulationState, updateSimulationState } from '@/lib/simulation';

export async function POST() {
  const state = getSimulationState();
  if (state.circuitBreakerLocked) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  // Artificial delay or work
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Increment counter in state directly (mostly tracked by the ticker, but we can do it here too)
  updateSimulationState({ totalRequests: state.totalRequests + 1 });

  return NextResponse.json({ success: true });
}

export async function GET() {
  return POST();
}
