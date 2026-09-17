import React, { useState, useEffect, useMemo } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Play, Square, Settings2, AlertTriangle, ShieldCheck, TrendingUp, HandCoins } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppBFinOpsSentry() {
  const { telemetry, history } = useSimulationStore();
  const [budgetCap, setBudgetCap] = useState(5.0);
  const [maxServers, setMaxServers] = useState(10);
  const [targetRps, setTargetRps] = useState(500);
  const [apiKey, setApiKey] = useState('sk_sentry_live_test_');
  const [endpoint, setEndpoint] = useState('/api/target/workload');
  const [autoMitigate, setAutoMitigate] = useState(false);

  // Sync initial state when telemetry loads
  useEffect(() => {
    if (telemetry && !telemetry.circuit_breaker_locked) {
      // Just keep local state in sync or let local state drive backend
    }
  }, [telemetry]);

  const handleLaunch = async () => {
    await fetch('/api/target/control', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ action: 'RESET', budget: budgetCap, max_servers_cap: maxServers })
    });
    await fetch('/api/attacker/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rps_target: targetRps, endpoint })
    });
  };

  const handleStop = async () => {
    await fetch('/api/attacker/stop', { method: 'POST' });
  };

  const handleAction = async (action: string) => {
    await fetch('/api/target/control', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ action, max_servers_cap: maxServers })
    });
    if (action === 'FORCE_SCALE_DOWN' || action === 'TOTAL_SHUTDOWN') {
      await handleStop();
    }
  };

  const updateConfig = async (key: string, value: number) => {
    if (key === 'budgetCap') setBudgetCap(value);
    if (key === 'maxServers') {
        setMaxServers(value);
        await fetch('/api/target/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ action: 'SET_MAX_SERVERS', max_servers_cap: value })
        });
    }
  };

  // Economy Score Math
  const economyScore = useMemo(() => {
    if (!telemetry) return 100;
    const budgetFactor = Math.max(0, 1 - (telemetry.session_cost / telemetry.budget_cap)) * 50;
    const maxProjectedBurn = maxServers * 0.34; // 0.34 hourly per server
    const burnRateFactor = Math.max(0, 1 - (telemetry.hourly_burn_rate / maxProjectedBurn)) * 30;
    const stabilityFactor = telemetry.circuit_breaker_locked ? 0 : 20;
    return Math.max(0, Math.min(100, Math.round(budgetFactor + burnRateFactor + stabilityFactor)));
  }, [telemetry, maxServers]);

  const scoreColor = economyScore > 79 ? 'text-emerald-400' : economyScore > 49 ? 'text-amber-400' : 'text-red-500';
  const scoreBgColor = economyScore > 79 ? 'bg-emerald-500' : economyScore > 49 ? 'bg-amber-500' : 'bg-red-500';

  // Format history for recharts
  const chartData = history.map((h, i) => ({
    time: i,
    RPS: h.current_rps,
    Servers: h.active_servers,
    Cost: h.session_cost,
  }));

  const showModal = telemetry?.circuit_breaker_locked;

  useEffect(() => {
    if (showModal && autoMitigate) {
      const timer = setTimeout(() => {
        handleAction('FORCE_SCALE_DOWN');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showModal, autoMitigate]);

  return (
    <div className="flex flex-col gap-6 w-full h-full relative">
      {/* Control Bar */}
      <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800/50 rounded-lg">
              <Settings2 className="text-zinc-400" size={20} />
            </div>
            <span className="font-semibold text-zinc-200 tracking-wide">Simulation Configuration</span>
          </div>
          <div className="flex gap-3">
            <button onClick={handleStop} className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-all shadow-sm">
              <Square size={14} fill="currentColor" /> Stop
            </button>
            <button onClick={handleLaunch} className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg text-sm shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:shadow-[0_0_25px_rgba(234,88,12,0.6)] transition-all">
              <Play size={14} fill="currentColor" /> Launch Attack
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 font-semibold block">Target Endpoint URL</label>
            <input type="text" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5 text-sm text-zinc-300 focus:border-blue-500/50 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 font-semibold block">Control Webhook Bearer Token</label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5 text-sm text-zinc-300 focus:border-blue-500/50 focus:outline-none transition-colors font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div className="group">
            <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 font-semibold flex items-center justify-between block">
              Budget Ceiling
              <span className="text-emerald-400 font-mono">${budgetCap.toFixed(2)}</span>
            </label>
            <input type="range" min="0.1" max="50" step="0.1" value={budgetCap} onChange={(e) => updateConfig('budgetCap', parseFloat(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="group">
            <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 font-semibold flex items-center justify-between block">
              Max Server Cap
              <span className="text-purple-400 font-mono">{maxServers} Nodes</span>
            </label>
            <input type="range" min="1" max="20" step="1" value={maxServers} onChange={(e) => updateConfig('maxServers', parseInt(e.target.value))} className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="group">
            <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 font-semibold flex items-center justify-between block">
              Target Load
              <span className="text-blue-400 font-mono">{targetRps} RPS</span>
            </label>
            <input type="range" min="100" max="2000" step="50" value={targetRps} onChange={(e) => setTargetRps(parseInt(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-zinc-800/60">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={autoMitigate} onChange={(e) => setAutoMitigate(e.target.checked)} />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
          </label>
          <span className="text-sm text-zinc-300 font-medium">Auto-Mitigate Breach (Instantly Scales Down on Breaker Trip)</span>
        </div>
      </div>

      {/* Telemetry & Economy Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[300px]">
        
        {/* Economy Score */}
        <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
          <div className="absolute top-6 left-6 flex items-center gap-2 text-zinc-400">
            <div className="p-1.5 bg-zinc-800/50 rounded-md">
              <ShieldCheck size={16} />
            </div>
            <span className="text-xs uppercase tracking-widest font-semibold">Economy Score</span>
          </div>
          
          <div className="relative mt-10">
             {/* Circular Gauge approximation */}
             <svg className="w-44 h-44 transform -rotate-90 drop-shadow-xl">
                <circle cx="88" cy="88" r="76" fill="transparent" stroke="#18181b" strokeWidth="14" />
                <circle 
                  cx="88" cy="88" r="76" fill="transparent" 
                  stroke="currentColor" strokeWidth="14" 
                  strokeDasharray={`${(economyScore / 100) * 477} 477`}
                  className={`transition-all duration-1000 ease-out ${scoreColor}`}
                  strokeLinecap="round"
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-lg">
                <span className={`text-5xl font-black ${scoreColor}`}>{economyScore}</span>
                <span className="text-xs text-zinc-500 font-mono mt-1 tracking-widest uppercase">Index</span>
             </div>
          </div>
          <div className="mt-8 text-center text-sm text-zinc-500 max-w-[200px] leading-relaxed">
             Financial Health Index based on burn rate and budget thresholds.
          </div>
        </div>

        {/* Live Charts */}
        <div className="md:col-span-2 bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-6 flex flex-col shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-400">
               <TrendingUp size={16} />
            </div>
            <span className="text-xs uppercase tracking-widest font-semibold text-zinc-400">Live Telemetry Stream</span>
          </div>
          <div className="flex flex-col flex-1 w-full gap-4 min-h-[350px]">
            {/* RPS Chart */}
            <div className="flex-1 w-full flex flex-col bg-zinc-950/40 rounded-xl p-3 border border-zinc-800/30">
              <span className="text-[10px] text-blue-400 font-semibold mb-2 ml-1 tracking-widest uppercase">Traffic (RPS)</span>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.4} />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#3b82f6" tick={{fill: '#52525b', fontSize: 10}} axisLine={false} tickLine={false} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', fontWeight: 500 }} labelStyle={{ display: 'none' }} />
                    <Line type="monotone" dataKey="RPS" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Servers Chart */}
            <div className="flex-1 w-full flex flex-col bg-zinc-950/40 rounded-xl p-3 border border-zinc-800/30">
              <span className="text-[10px] text-purple-400 font-semibold mb-2 ml-1 tracking-widest uppercase">Active Nodes</span>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.4} />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#8b5cf6" tick={{fill: '#52525b', fontSize: 10}} axisLine={false} tickLine={false} width={60} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', fontWeight: 500 }} labelStyle={{ display: 'none' }} />
                    <Line type="stepAfter" dataKey="Servers" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Chart */}
            <div className="flex-1 w-full flex flex-col bg-zinc-950/40 rounded-xl p-3 border border-zinc-800/30">
              <span className="text-[10px] text-red-400 font-semibold mb-2 ml-1 tracking-widest uppercase">Cumulative Cost ($)</span>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.4} />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#ef4444" tick={{fill: '#52525b', fontSize: 10}} axisLine={false} tickLine={false} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', fontWeight: 500 }} labelStyle={{ display: 'none' }} />
                    <Line type="monotone" dataKey="Cost" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Circuit Breaker Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#09090b] border border-red-900/50 shadow-[0_0_80px_rgba(239,68,68,0.2)] rounded-2xl max-w-lg w-full p-8 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500 animate-pulse" />
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="flex items-start gap-5 relative z-10">
                <div className="p-4 bg-red-950/40 text-red-500 rounded-full shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  <AlertTriangle size={36} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-500 mb-3 tracking-wide">FINANCIAL BREAKER TRIPPED</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-8">
                    Target infrastructure has scaled to <span className="font-bold text-white bg-zinc-800 px-1.5 py-0.5 rounded">{telemetry?.active_servers}</span> nodes. 
                    Cumulative cost <span className="font-mono text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded border border-red-900/30">${telemetry?.session_cost.toFixed(4)}</span> has breached the authorized ceiling.
                    Immediate intervention required.
                  </p>
                  
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => handleAction('FREEZE_SCALE')}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-700/50 text-amber-400 transition-all text-left group"
                    >
                      <div>
                        <div className="font-bold text-sm tracking-wide">Cap Autoscaling Ceiling</div>
                        <div className="text-xs opacity-70 mt-1">Freezes ASG at current instance count. Drops excess traffic.</div>
                      </div>
                      <ShieldCheck size={24} className="opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                    </button>

                    <button 
                      onClick={() => handleAction('FORCE_SCALE_DOWN')}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-orange-900/50 bg-orange-950/30 hover:bg-orange-900/40 hover:border-orange-700/50 text-orange-400 transition-all text-left group shadow-[0_0_15px_rgba(234,88,12,0.15)] hover:shadow-[0_0_20px_rgba(234,88,12,0.25)]"
                    >
                      <div>
                        <div className="font-bold text-sm tracking-wide text-orange-300">Graceful Scale-Down</div>
                        <div className="text-xs opacity-80 text-orange-400/80 mt-1">Terminates {telemetry?.active_servers - 1} instances. Drops to baseline (1 node).</div>
                      </div>
                      <HandCoins size={24} className="text-orange-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                    </button>

                    <button 
                      onClick={() => handleAction('TOTAL_SHUTDOWN')}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-red-900/50 bg-red-950/30 hover:bg-red-900/40 hover:border-red-700/50 text-red-400 transition-all text-left shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] group"
                    >
                      <div>
                        <div className="font-bold text-sm tracking-wide text-red-300">Total Infrastructure Blackout</div>
                        <div className="text-xs opacity-80 text-red-400/80 mt-1">Stops all {telemetry?.active_servers} instances immediately. 100% downtime.</div>
                      </div>
                      <Square size={24} className="text-red-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
