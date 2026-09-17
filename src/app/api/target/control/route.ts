import { NextResponse } from 'next/server';
import { getSimulationState, updateSimulationState } from '@/lib/simulation';

export async function POST(req: Request) {
  // Simple auth check
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer sk_sentry_live_test_')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const state = getSimulationState();

    switch (body.action) {
      case 'FREEZE_SCALE':
        updateSimulationState({
          circuitBreakerLocked: true,
          maxServers: state.activeServers,
        });
        return NextResponse.json({ success: true, message: 'Autoscaling frozen' });

      case 'FORCE_SCALE_DOWN':
        updateSimulationState({
          circuitBreakerLocked: true,
          activeServers: 1,
          terminatedServers: state.terminatedServers + (state.activeServers - 1),
        });
        return NextResponse.json({ success: true, message: 'Forced scale down to 1 node' });

      case 'TOTAL_SHUTDOWN':
        updateSimulationState({
          circuitBreakerLocked: true,
          activeServers: 0,
          terminatedServers: state.terminatedServers + state.activeServers,
        });
        return NextResponse.json({ success: true, message: 'Total shutdown to 0 nodes' });

      case 'SET_MAX_SERVERS':
        if (typeof body.max_servers_cap === 'number') {
          updateSimulationState({ maxServers: body.max_servers_cap });
          return NextResponse.json({ success: true, message: `Max servers set to ${body.max_servers_cap}` });
        }
        return NextResponse.json({ error: 'Invalid max_servers_cap' }, { status: 400 });

      case 'UPDATE_BUDGET':
        if (typeof body.budget === 'number') {
           updateSimulationState({ budgetCap: body.budget });
           return NextResponse.json({ success: true, message: `Budget updated` });
        }
        return NextResponse.json({ error: 'Invalid budget' }, { status: 400 });

      case 'RESET':
        // Re-import resetSimulation to use it, actually let's just reset fields manually
        updateSimulationState({
          isAttacking: false,
          targetRps: 0,
          currentRps: 0,
          totalRequests: 0,
          activeServers: 1,
          bootingServers: 0,
          terminatedServers: 0,
          accumulatedCost: 0,
          hourlyBurnRate: 0.34,
          circuitBreakerLocked: false,
          maxServers: body.max_servers_cap || 10,
          budgetCap: body.budget || 5.0,
        });
        return NextResponse.json({ success: true, message: 'Simulation reset' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
