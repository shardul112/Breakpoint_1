'use client';

import React, { useEffect } from 'react';
import AppATargetDashboard from '@/components/AppATargetDashboard';
import AppBFinOpsSentry from '@/components/AppBFinOpsSentry';

export default function FinOpsSimulator() {
  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#030712] text-zinc-100 overflow-hidden relative selection:bg-emerald-500/30">
      {/* Background ambient light */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />

      {/* App A - Target Website HUD */}
      <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-zinc-800/50 flex flex-col p-6 lg:p-10 overflow-y-auto relative z-10 backdrop-blur-sm bg-zinc-950/40">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">Target Infrastructure</h2>
            <div className="text-xs text-zinc-500 font-mono tracking-widest uppercase">APP-A-NODE-CLUSTER</div>
          </div>
        </div>
        <AppATargetDashboard />
      </div>

      {/* App B - FinOps Sentry Control Platform */}
      <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col p-6 lg:p-10 bg-zinc-950/60 backdrop-blur-md overflow-y-auto relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg relative">
             <div className="absolute inset-0 bg-emerald-500/20 rounded-lg blur-sm"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] z-10"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200">Breakpoint</h2>
            <div className="text-xs text-emerald-500/70 font-mono tracking-widest uppercase">ECONOMY-ORCHESTRATOR-B</div>
          </div>
        </div>
        <AppBFinOpsSentry />
      </div>
    </div>
  );
}
