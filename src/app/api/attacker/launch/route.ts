import { NextResponse } from 'next/server';
import { updateSimulationState } from '@/lib/simulation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rpsTarget = body.rps_target || 500;

    updateSimulationState({
      isAttacking: true,
      targetRps: rpsTarget,
      circuitBreakerLocked: false, // Reset breaker on new launch if needed (or not, but we'll reset it for the demo)
    });

    return NextResponse.json({ success: true, message: `Attack launched targeting ${rpsTarget} RPS` });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
