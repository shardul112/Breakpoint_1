import { NextResponse } from 'next/server';
import { updateSimulationState } from '@/lib/simulation';

export async function POST() {
  updateSimulationState({
    isAttacking: false,
    targetRps: 0,
  });

  return NextResponse.json({ success: true, message: 'Attack stopped' });
}
