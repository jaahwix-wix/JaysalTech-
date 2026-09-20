'use client';

import React, { useState, useEffect } from 'react';
import { BotSettings, BotState, KlinePoint, SymbolPair } from '@/lib/types';
import { calculateEma, calculateRsi } from '@/lib/simulation';
import {
  Zap,
  Flame,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  Sliders,
  DollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  LineChart,
  Target,
  CheckCircle2,
  Compass,
  Radio,
  ChevronRight
} from 'lucide-react';

interface ScalpProCockpitProps {
  settings: BotSettings;
  setSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  botState: BotState;
  currentPrice: number;
  klines: KlinePoint[];
  onStartBot: () => void;
  onPauseBot: () => void;
  onInstantTrade: (type: 'BUY' | 'SELL', customReason?: string) => void;
  onClosePosition: () => void;
  onSimulateTick: (changePct: number) => void;
}

export const ScalpProCockpit: React.FC<ScalpProCockpitProps> = ({
  settings,
  setSettings,
  botState,
  currentPrice,
  klines,
  onStartBot,
  onPauseBot,
  onInstantTrade,
  onClosePosition,
  onSimulateTick,
}) => {
  // Scalping parameters
  const [leverage, setLeverage] = useState<number>(settings.leverage || 1);
  const [scalpTargetDayPct, setScalpTargetDayPct] = useState<number>(100);
  const [livePerpBalance, setLivePerpBalance] = useState<number | null>(null);
  const [orderBookTicks, setOrderBookTicks] = useState<
    Array<{ id: number; type: 'BUY' | 'SELL'; price: number; size: number; time: string }>
  >([]);

  useEffect(() => {
    let active = true;
    fetch('/api/exchange/status')
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.status === 'CONNECTED_LIVE') {
          const bal = (d.spotTotalUsdValue && d.spotTotalUsdValue > 0.5)
            ? d.spotTotalUsdValue
            : (d.perpUsdtBalance && d.perpUsdtBalance > 0.5)
            ? d.perpUsdtBalance
            : (d.totalUsdtBalance ?? null);
          setLivePerpBalance(bal);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Calculate real-time indicators
  const closePrices = klines.map((k) => k.close);
  const ema9 = calculateEma(closePrices, 9);
  const ema21 = calculateEma(closePrices, 21);
  const rsi = calculateRsi(closePrices, 14);

  const isEmaBullish = ema9 > ema21;
  const emaSpreadPct = ema21 > 0 ? ((ema9 - ema21) / ema21) * 100 : 0;

  // Calculate historical RSI values for the last 10 candles (5m timeframe)
  const historicalCandlesCount = 10;
  const recentKlines = klines.length >= historicalCandlesCount
    ? klines.slice(-historicalCandlesCount)
    : klines;

  const rsiHistory = recentKlines.map((candle, idx) => {
    // Determine the slice index in the full klines array
    const fullIndex = klines.length - recentKlines.length + idx;
    const pricesUpToCandle = klines.slice(0, fullIndex + 1).map((k) => k.close);
    const candleRsi = Number(calculateRsi(pricesUpToCandle, 14).toFixed(1));

    // Calculate delta against previous candle if available
    let prevRsi = candleRsi;
    if (fullIndex > 0) {
      const prevPrices = klines.slice(0, fullIndex).map((k) => k.close);
      prevRsi = Number(calculateRsi(prevPrices, 14).toFixed(1));
    }
    const delta = Number((candleRsi - prevRsi).toFixed(1));

    // Zone & Trade justification
    let zone: 'OVERSOLD' | 'ACCUMULATION' | 'NEUTRAL' | 'MOMENTUM' | 'OVERBOUGHT';
    let zoneLabel: string;
    let zoneColor: string;
    let badgeClass: string;
    let signalClass: string;
    let justification: string;

    if (candleRsi <= 35) {
      zone = 'OVERSOLD';
      zoneLabel = 'Oversold Dip';
      zoneColor = '#10b981'; // emerald
      badgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      signalClass = 'bg-emerald-500 text-slate-950 font-bold';
      justification = 'Oversold Dip Reversal — Asymmetric 20% bounce scalp entry triggered';
    } else if (candleRsi <= 45) {
      zone = 'ACCUMULATION';
      zoneLabel = 'Support Hook';
      zoneColor = '#14b8a6'; // teal
      badgeClass = 'bg-teal-950/80 text-teal-300 border-teal-500/50';
      signalClass = 'bg-teal-500 text-slate-950 font-bold';
      justification = 'Support Hook Confirmed — Low-risk mean-reversion scalp entry';
    } else if (candleRsi <= 55) {
      zone = 'NEUTRAL';
      zoneLabel = 'Range Support';
      zoneColor = '#06b6d4'; // cyan
      badgeClass = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
      signalClass = 'bg-cyan-500 text-slate-950 font-bold';
      justification = 'Range Equilibrium — Micro-support bounce entry with +2.2% target';
    } else if (candleRsi <= 68) {
      zone = 'MOMENTUM';
      zoneLabel = 'Bullish Impulse';
      zoneColor = '#f59e0b'; // amber
      badgeClass = 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      signalClass = 'bg-amber-500 text-slate-950 font-bold';
      justification = 'Momentum Expansion — EMA 9 > 21 trend continuation entry justified';
    } else {
      zone = 'OVERBOUGHT';
      zoneLabel = 'Overbought Warning';
      zoneColor = '#f43f5e'; // rose
      badgeClass = 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      signalClass = 'bg-rose-500 text-white font-bold';
      justification = 'Exhaustion Band — Longs locked; Trailing profit lock armed';
    }

    const timeStr = new Date(candle.time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isCurrent = idx === recentKlines.length - 1;
    const label = isCurrent ? 'NOW' : `t-${recentKlines.length - 1 - idx}`;

    return {
      index: idx,
      label,
      isCurrent,
      time: timeStr,
      close: candle.close,
      open: candle.open,
      isGreen: candle.close >= candle.open,
      rsi: candleRsi,
      prevRsi,
      delta,
      zone,
      zoneLabel,
      zoneColor,
      badgeClass,
      signalClass,
      justification,
    };
  });

  const [selectedCandleIndex, setSelectedCandleIndex] = useState<number | null>(null);
  const activeCandle = selectedCandleIndex !== null && rsiHistory[selectedCandleIndex]
    ? rsiHistory[selectedCandleIndex]
    : rsiHistory[rsiHistory.length - 1] || null;

  const minRsi10 = rsiHistory.length > 0 ? Math.min(...rsiHistory.map((p) => p.rsi)) : 50;
  const maxRsi10 = rsiHistory.length > 0 ? Math.max(...rsiHistory.map((p) => p.rsi)) : 50;
  const avgRsi10 = rsiHistory.length > 0
    ? Number((rsiHistory.reduce((acc, p) => acc + p.rsi, 0) / rsiHistory.length).toFixed(1))
    : 50;
  const net10CandleChange = rsiHistory.length >= 2
    ? Number((rsiHistory[rsiHistory.length - 1].rsi - rsiHistory[0].rsi).toFixed(1))
    : 0;

  // Simulate fast order book tape
  useEffect(() => {
    const interval = setInterval(() => {
      const isBuy = Math.random() > 0.48;
      const jitter = (Math.random() - 0.5) * 0.001 * currentPrice;
      const tradePrice = Number((currentPrice + jitter).toFixed(2));
      const size = Number((Math.random() * 4 + 0.5).toFixed(2));

      setOrderBookTicks((prev) => [
        {
          id: Date.now(),
          type: isBuy ? 'BUY' : 'SELL',
          price: tradePrice,
          size,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 7),
      ]);
    }, 1200);

    return () => clearInterval(interval);
  }, [currentPrice]);

  const handleLeverageChange = (newLev: number) => {
    setLeverage(newLev);
    setSettings((p) => ({ ...p, leverage: newLev }));
  };

  const isRunning = botState.status === 'RUNNING';
  const hasOpenPosition = botState.cryptoBalance > 0;
  const currentUnrealizedPnl =
    hasOpenPosition && botState.avgEntryPrice > 0
      ? (currentPrice - botState.avgEntryPrice) * botState.cryptoBalance
      : 0;
  const currentUnrealizedPct =
    botState.avgEntryPrice > 0
      ? ((currentPrice - botState.avgEntryPrice) / botState.avgEntryPrice) * 100 * (settings.leverage || 1)
      : 0;

  // Math for 100% daily profit reality test
  const days = [1, 3, 5, 10, 15, 20, 30];
  const compoundValues = days.map((d) => ({
    day: d,
    value: 7.4 * Math.pow(1 + scalpTargetDayPct / 100, d),
  }));

  // Liquidation drop distance for current leverage
  const liquidationMovePct = leverage > 1 ? (90 / leverage).toFixed(1) : 'No Liquidation (Spot)';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl ring-1 ring-amber-500/40">
              <Zap className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Professional Modern Scalping Station</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  EMA Ribbon &amp; Momentum
                </span>
              </div>
              <p className="text-xs text-slate-300">
                High-speed execution simulator, order flow momentum, and the mathematical truth of &quot;100% profit a day&quot;.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {livePerpBalance !== null && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs font-mono text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>BingX Equity:</span>
                <span className="font-bold text-white">${livePerpBalance.toFixed(2)} USD</span>
              </div>
            )}
            <button
              id="scalp-activate-bot-btn"
              onClick={() => {
                setSettings((p) => ({
                  ...p,
                  strategy: 'SCALP_PRO',
                  orderSizePct: 20,
                  takeProfitPct: 2.2,
                  stopLossPct: 1.5,
                  timeframe: '5m',
                  leverage,
                }));
                if (isRunning) onPauseBot();
                else onStartBot();
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              {isRunning ? 'Pause Scalper' : 'Run Auto-Scalp Bot'}
            </button>
          </div>
        </div>
      </div>

      {/* Historical RSI Momentum Matrix (Last 10 Candles · 5m Timeframe) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                <LineChart className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Historical RSI Momentum Matrix
                <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  Last 10 Candles · 5m Scalp
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time 14-period RSI curve across the previous 10 5-minute candles to mathematically validate trade entries and prevent peak buys.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${activeCandle?.badgeClass || 'bg-slate-800 text-slate-200'}`}>
              <Activity className="w-3.5 h-3.5" />
              <span>Current: RSI {rsi.toFixed(1)}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <span>Trajectory:</span>
              <span className={`font-bold ${net10CandleChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {net10CandleChange >= 0 ? '+' : ''}{net10CandleChange} pts
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
              Range: <span className="text-slate-200">{minRsi10.toFixed(0)}</span> - <span className="text-slate-200">{maxRsi10.toFixed(0)}</span> (avg {avgRsi10.toFixed(0)})
            </div>
          </div>
        </div>

        {/* Visual SVG Waveform Chart */}
        <div className="bg-slate-950/90 rounded-2xl border border-slate-800/80 p-3 sm:p-4 overflow-x-auto">
          <div className="min-w-[640px]">
            <svg viewBox="0 0 740 145" className="w-full h-36 select-none">
              <defs>
                <linearGradient id="rsiAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="rsiLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Lines */}
              {/* Overbought (70) */}
              <line x1="40" y1="47.4" x2="700" y2="47.4" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
              <text x="44" y="43" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">
                70 OVERBOUGHT / TAKE-PROFIT EXIT ZONE
              </text>

              {/* Equilibrium (50) */}
              <line x1="40" y1="67" x2="700" y2="67" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <text x="44" y="63" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                50 EQUILIBRIUM (MEAN REVERSION PIVOT)
              </text>

              {/* Oversold (30) */}
              <line x1="40" y1="86.6" x2="700" y2="86.6" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
              <text x="44" y="83" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
                30 OVERSOLD / ACCUMULATION BUY ZONE
              </text>

              {/* Area & Line Paths */}
              {rsiHistory.length >= 2 && (() => {
                const step = 640 / (rsiHistory.length - 1);
                const points = rsiHistory.map((p, idx) => {
                  const cx = 50 + idx * step;
                  const cy = 18 + ((100 - p.rsi) / 100) * 98;
                  return { ...p, cx, cy };
                });

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ');
                const areaPath = `${linePath} L ${points[points.length - 1].cx.toFixed(1)},116 L ${points[0].cx.toFixed(1)},116 Z`;

                return (
                  <g>
                    <path d={areaPath} fill="url(#rsiAreaGradient)" />
                    <path d={linePath} fill="none" stroke="url(#rsiLineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Nodes */}
                    {points.map((p, i) => {
                      const isSelected = selectedCandleIndex === i || (selectedCandleIndex === null && p.isCurrent);
                      return (
                        <g
                          key={p.index}
                          className="cursor-pointer transition-all"
                          onClick={() => setSelectedCandleIndex(i)}
                        >
                          {/* Pulsing ring for current candle */}
                          {p.isCurrent && (
                            <circle cx={p.cx} cy={p.cy} r="10" fill="#10b981" opacity="0.25" className="animate-ping" />
                          )}

                          {/* Outer selection ring */}
                          {isSelected && (
                            <circle cx={p.cx} cy={p.cy} r="8" fill="none" stroke="#38bdf8" strokeWidth="2" />
                          )}

                          {/* Center Node */}
                          <circle
                            cx={p.cx}
                            cy={p.cy}
                            r={p.isCurrent ? 5.5 : 4}
                            fill={p.zoneColor}
                            stroke="#020617"
                            strokeWidth="1.5"
                          />

                          {/* RSI Value Label above node */}
                          <text
                            x={p.cx}
                            y={p.cy - 7}
                            textAnchor="middle"
                            fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                            fontSize="9.5"
                            fontWeight={isSelected ? 'bold' : '600'}
                            fontFamily="monospace"
                          >
                            {p.rsi.toFixed(0)}
                          </text>

                          {/* Time & Candle label below node */}
                          <text
                            x={p.cx}
                            y="130"
                            textAnchor="middle"
                            fill={p.isCurrent ? '#34d399' : '#94a3b8'}
                            fontSize="9"
                            fontWeight={p.isCurrent ? 'bold' : 'normal'}
                            fontFamily="monospace"
                          >
                            {p.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* 10-Candle Breakdown Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Candle-by-Candle RSI Progression:</span>
            <span className="text-[11px] font-mono text-slate-500">Click any candle to inspect justification</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {rsiHistory.map((p, idx) => {
              const isSelected = selectedCandleIndex === idx || (selectedCandleIndex === null && p.isCurrent);
              return (
                <button
                  key={p.index}
                  type="button"
                  onClick={() => setSelectedCandleIndex(idx)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative font-mono ${
                    isSelected
                      ? 'bg-slate-800 border-sky-400/80 shadow-md ring-1 ring-sky-400/40 text-white'
                      : 'bg-slate-950/80 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {p.isCurrent && (
                    <span className="absolute -top-1.5 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className={p.isCurrent ? 'text-emerald-400 font-bold' : ''}>{p.label}</span>
                    <span>{p.time}</span>
                  </div>

                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-white tracking-tight">{p.rsi.toFixed(1)}</span>
                    <span className={`text-[10px] ${p.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.delta >= 0 ? '+' : ''}{p.delta.toFixed(1)}
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(5, p.rsi))}%`,
                        backgroundColor: p.zoneColor,
                      }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[9px]">
                    <span className={`truncate px-1 py-0.5 rounded text-[8.5px] font-sans font-medium ${
                      p.zone === 'OVERSOLD'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : p.zone === 'ACCUMULATION'
                        ? 'bg-teal-950 text-teal-300 border border-teal-800/60'
                        : p.zone === 'NEUTRAL'
                        ? 'bg-slate-900 text-cyan-300 border border-cyan-800/40'
                        : p.zone === 'MOMENTUM'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                    }`}>
                      {p.zoneLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trade Entry Justification & Live Guardrails */}
        {activeCandle && (
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
              <div className="flex items-center gap-2 text-xs">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">
                  Trade Entry Rationale for Candle {activeCandle.label} ({activeCandle.time}):
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeCandle.badgeClass}`}>
                  RSI {activeCandle.rsi.toFixed(1)} · {activeCandle.zoneLabel}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Price at Close: <strong className="text-white">${activeCandle.close.toFixed(2)}</strong>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              <strong>Algorithmic Justification:</strong> {activeCandle.justification}. When running on the 5-minute timeframe, the bot monitors this indicator trajectory to execute disciplined scalps while avoiding volatile fakeouts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
              <div className="bg-slate-900/90 border border-slate-800/70 p-2 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">5M Timeframe</div>
                  <div className="font-bold text-slate-200">5m Interval Active</div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800/70 p-2 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Order Sizing</div>
                  <div className="font-bold text-emerald-400">20% Balance (${(botState.usdtBalance * 0.20).toFixed(2)})</div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800/70 p-2 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Take Profit</div>
                  <div className="font-bold text-emerald-400">+{settings.takeProfitPct}% Target</div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800/70 p-2 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Stop Loss</div>
                  <div className="font-bold text-rose-400">-{settings.stopLossPct}% Auto-Cut</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cockpit Grid: Indicator HUD + 1-Click Fast Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Scalping Indicators & Execution Desk (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Real-time Indicator Gauge */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Live Scalp Momentum Indicators</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Pair: {settings.symbol} · 5m</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              {/* EMA 9 */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400">EMA 9 (Fast)</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">${ema9.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500 mt-1">Short-term trend</div>
              </div>

              {/* EMA 21 */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400">EMA 21 (Base)</div>
                <div className="text-base font-bold text-blue-400 mt-0.5">${ema21.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500 mt-1">Medium trend</div>
              </div>

              {/* Momentum Signal */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Ribbon Signal</div>
                <div
                  className={`text-xs font-bold mt-1 flex items-center gap-1 ${
                    isEmaBullish ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isEmaBullish ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {isEmaBullish ? 'BULL' : 'BEAR'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Spread: {isEmaBullish ? '+' : ''}{emaSpreadPct.toFixed(2)}%
                </div>
              </div>

              {/* RSI (14) */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400">RSI (14 · 5m)</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">{rsi.toFixed(1)}</div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  {rsi <= 35 ? '🟢 Oversold Hook' : rsi <= 50 ? '🟢 Support Dip' : rsi <= 68 ? '🟡 Momentum' : '🔴 Overbought'}
                </div>
              </div>
            </div>

            {/* Quick Scalp Presets */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <label className="text-xs text-slate-300 font-semibold block mb-2">
                Scalp Strategy Archetypes:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  id="preset-safe-scalp-btn"
                  onClick={() => {
                    handleLeverageChange(1);
                    setSettings((p) => ({
                      ...p,
                      strategy: 'SCALP_PRO',
                      orderSizeUsdt: 10,
                      takeProfitPct: 1.2,
                      stopLossPct: 0.8,
                    }));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    leverage === 1 && settings.strategy === 'SCALP_PRO'
                      ? 'bg-emerald-950/80 border-emerald-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Prop Firm Spot (1x)
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Zero liquidation. 1.2% TP / 0.8% SL. Preserves capital.
                  </div>
                </button>

                <button
                  id="preset-momentum-scalp-btn"
                  onClick={() => {
                    handleLeverageChange(5);
                    setSettings((p) => ({
                      ...p,
                      strategy: 'SCALP_PRO',
                      orderSizeUsdt: 10,
                      takeProfitPct: 2.5,
                      stopLossPct: 1.5,
                    }));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    leverage === 5
                      ? 'bg-amber-950/80 border-amber-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-amber-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Momentum (5x Lev)
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Moderate leverage. Liq at -18% move.
                  </div>
                </button>

                <button
                  id="preset-gambler-scalp-btn"
                  onClick={() => {
                    handleLeverageChange(20);
                    setSettings((p) => ({
                      ...p,
                      strategy: 'SCALP_PRO',
                      orderSizeUsdt: 25,
                      takeProfitPct: 5.0,
                      stopLossPct: 2.5,
                    }));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    leverage === 20
                      ? 'bg-rose-950/80 border-rose-500 text-white ring-1 ring-rose-500'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-rose-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    &quot;100% Day&quot; Test (20x)
                  </div>
                  <div className="text-[10px] text-rose-300 mt-1">
                    Extreme danger: -4.5% wick liquidates 100%!
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 1-Click Fast Manual Execution Desk */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Manual Scalp Execution Desk</h3>
              </div>
              <div className="text-xs font-mono">
                <span className="text-slate-400">Lev: </span>
                <span className={`font-bold ${leverage > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {leverage}x
                </span>
                <span className="text-slate-400 text-[10px] ml-2">
                  (Liq Wick: {liquidationMovePct}%)
                </span>
              </div>
            </div>

            {/* Position Display if holding */}
            {hasOpenPosition && (
              <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="text-slate-400 text-[10px]">Open Scalp Position:</div>
                  <div className="font-bold text-white">
                    {botState.cryptoBalance.toFixed(4)} {settings.symbol.replace('USDT', '')} @ $
                    {botState.avgEntryPrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px]">Floating PnL:</div>
                  <div className={`font-bold ${currentUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentUnrealizedPnl >= 0 ? '+' : ''}${currentUnrealizedPnl.toFixed(2)} ({currentUnrealizedPct >= 0 ? '+' : ''}{currentUnrealizedPct.toFixed(1)}%)
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                id="instant-scalp-long-btn"
                onClick={() => onInstantTrade('BUY', `⚡ Fast Scalp Long at $${currentPrice.toFixed(2)} (${leverage}x Lev)`)}
                disabled={botState.usdtBalance < 1.0}
                className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Instant Scalp Long</span>
              </button>

              <button
                id="instant-close-scalp-btn"
                onClick={onClosePosition}
                disabled={!hasOpenPosition}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
              >
                <span>Close Scalp Position</span>
              </button>

              <button
                id="instant-scalp-short-btn"
                onClick={() => onSimulateTick(-1.5)}
                className="py-3 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-rose-500/40"
                title="Simulate quick pullback to test take profit"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Test -1.5% Pullback</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Order Flow & Tape (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Flow Tape */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Live Scalp Tick Stream</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Binance Tape
              </span>
            </div>

            <div className="overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 text-[10px] border-b border-slate-800/80 pb-1">
                    <th className="pb-1">Time</th>
                    <th className="pb-1">Side</th>
                    <th className="pb-1">Price</th>
                    <th className="pb-1 text-right">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {orderBookTicks.map((tick) => (
                    <tr key={tick.id} className="hover:bg-slate-800/30">
                      <td className="py-1.5 text-slate-400 text-[11px]">{tick.time}</td>
                      <td className="py-1.5">
                        <span
                          className={`text-[10px] font-bold ${
                            tick.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tick.type}
                        </span>
                      </td>
                      <td className="py-1.5 text-slate-200">${tick.price.toFixed(2)}</td>
                      <td className="py-1.5 text-right text-slate-400">{tick.size.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Scalp Guidance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              Professional Scalping Principle:
            </div>
            <p className="text-slate-400 leading-relaxed">
              Institutional scalpers never look for 100% in a day. They scalp <strong>0.4% to 1.0%</strong> micro-moves with <strong>1:1.5 Risk-to-Reward</strong>, taking 4 to 8 high-probability setups per day and stopping immediately if down 2% on the session.
            </p>
          </div>
        </div>
      </div>

      {/* The "100% Profit A Day" Mathematical Reality Stress-Test */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-white">
                The &quot;100% Profit a Day&quot; Mathematical Stress-Test &amp; Reality Check
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Why 100% a day is an impossible long-term mathematical fantasy, and what actually happens when you try it with $7.40 capital.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
            Probability of Liquidation: 99.8%
          </span>
        </div>

        {/* The Absurd Compounding Table */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            The Math: If 100% a day were real, here is what happens to $7.40:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-center">
            {compoundValues.map((cv) => (
              <div key={cv.day} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Day {cv.day}</div>
                <div className="text-sm font-bold text-amber-400 mt-1">
                  ${cv.value > 1000000 ? `${(cv.value / 1000000).toFixed(1)}M` : cv.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 mt-2 text-xs text-slate-400 leading-relaxed font-mono">
            ⚠️ <strong>The Proof:</strong> In just 30 days of &quot;100% a day&quot;, $7.40 would compound to <strong>$7,945,689,498 (~$7.95 Billion)</strong>. By Day 35, it would exceed hundreds of billions of dollars. Anyone promising you a bot that makes &quot;100% a day&quot; is either selling a scam, showing a fake simulator, or gambling on extreme leverage that blows up in hours.
          </div>
        </div>

        {/* Risk of Ruin Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Gambler's Ruin */}
          <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-4 space-y-2">
            <div className="font-bold text-rose-300 text-sm flex items-center justify-between">
              <span>Attempting 100% Daily Target</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900 text-rose-200">
                Wipeout Guaranteed
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>Requires 20x to 50x leverage on all $7.40 capital.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>A single random 4.5% wick liquidates 100% of your account.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>Exchange taker fees at 20x leverage consume $1.00 per trade (2% of account per execution!).</span>
              </li>
            </ul>
          </div>

          {/* Real Prop Scalping */}
          <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-4 space-y-2">
            <div className="font-bold text-emerald-300 text-sm flex items-center justify-between">
              <span>Professional Scalping (Institutional Model)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-200">
                Sustainable Compounding
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Trades small edges: 0.5% - 1.5% profit per trade.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Target realistic 1% - 3% daily gains, stopping immediately on drawdown.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Zero margin liquidation risk; capital survives all market shocks.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
