import React, { useEffect } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Activity, Server, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AppATargetDashboard() {
  const { telemetry, startPolling } = useSimulationStore();

  useEffect(() => {
    startPolling();
    // No stopPolling on unmount to keep it running for demo, or we could stop it if needed.
  }, [startPolling]);

  if (!telemetry) {
    return <div className="animate-pulse text-zinc-500">Connecting to telemetry stream...</div>;
  }

  const {
    status,
    current_rps,
    total_requests,
    active_servers,
    max_servers,
    hourly_burn_rate,
    session_cost,
    circuit_breaker_locked
  } = telemetry;

  const isHealthy = !circuit_breaker_locked && current_rps < 100;
  const isScaling = !circuit_breaker_locked && current_rps >= 100;
  const isLocked = circuit_breaker_locked;

  // Generate server nodes for rack visualization
  const serverNodes = Array.from({ length: Math.max(max_servers, active_servers, 10) }).map((_, i) => {
    const isActive = i < active_servers;
    const isBooting = false; // Simplified for now
    
    let stateClass = "bg-zinc-900/50 border-zinc-800/80 opacity-50"; // standby
    if (isActive && isHealthy) stateClass = "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
    if (isActive && isScaling) stateClass = "bg-amber-950/40 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]";
    if (isActive && isLocked) stateClass = "bg-red-950/40 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]";

    return (
      <motion.div 
        key={i}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "h-14 md:h-20 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 group hover:border-opacity-100",
          stateClass
        )}
      >
        <Server size={20} className="z-10 mb-1 opacity-80 group-hover:opacity-100 transition-opacity" />
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-t from-current/10 to-transparent opacity-50" />
        )}
        <div className="absolute bottom-1 w-1/2 h-0.5 rounded-full bg-current opacity-30 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_currentColor]"></div>
      </motion.div>
    );
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      {/* Status Header */}
      <div className={cn(
        "p-5 rounded-2xl border backdrop-blur-md flex items-center gap-4 transition-all duration-700 shadow-xl relative overflow-hidden",
        isHealthy ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400" :
        isScaling ? "bg-amber-950/20 border-amber-900/50 text-amber-400" :
        "bg-red-950/20 border-red-900/50 text-red-400"
      )}>
        {/* Subtle background glow in status bar */}
        <div className={cn(
           "absolute inset-0 opacity-20 bg-gradient-to-r",
           isHealthy ? "from-emerald-500/0 via-emerald-500/10 to-emerald-500/0" :
           isScaling ? "from-amber-500/0 via-amber-500/10 to-amber-500/0 animate-pulse" :
           "from-red-500/0 via-red-500/10 to-red-500/0"
        )}></div>
        
        {isHealthy && <CheckCircle2 size={28} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
        {isScaling && <Activity size={28} className="animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />}
        {isLocked && <ShieldAlert size={28} className="drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
        <div className="relative z-10">
          <div className="text-xs uppercase tracking-widest opacity-60 font-semibold mb-0.5">Infrastructure Status</div>
          <div className="text-xl font-bold tracking-wide">{status}</div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-5 flex flex-col hover:bg-zinc-900/50 transition-colors">
          <div className="flex items-center gap-2 text-zinc-400 mb-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
               <Zap size={16} />
            </div>
            <span className="text-xs uppercase tracking-widest font-semibold">Total Traffic</span>
          </div>
          <div className="text-4xl font-mono font-bold text-zinc-100 tracking-tight">
            {total_requests.toLocaleString()}
          </div>
          <div className="text-sm mt-2 font-medium">
            Load: <span className={isScaling ? "text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]" : "text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"}>{current_rps} RPS</span>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-5 flex flex-col hover:bg-zinc-900/50 transition-colors">
          <div className="flex items-center gap-2 text-zinc-400 mb-3">
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
               <Activity size={16} />
            </div>
            <span className="text-xs uppercase tracking-widest font-semibold">Cost Telemetry</span>
          </div>
          <div className="text-4xl font-mono font-bold text-red-400 tracking-tight drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
            ${session_cost.toFixed(4)}
          </div>
          <div className="text-sm mt-2 font-medium">
            Burn rate: <span className="text-red-400">${hourly_burn_rate.toFixed(2)}/hr</span>
          </div>
        </div>
      </div>

      {/* Server Rack */}
      <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 flex flex-col flex-1 min-h-[200px]">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xs uppercase tracking-widest font-bold text-zinc-400">Active Compute Fleet</div>
          <div className="text-xs font-mono px-3 py-1 bg-zinc-950 rounded-full border border-zinc-800 text-zinc-300">
            [Active: {active_servers}] | [Cap: {max_servers}]
          </div>
        </div>
        <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-3">
          <AnimatePresence>
            {serverNodes}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
