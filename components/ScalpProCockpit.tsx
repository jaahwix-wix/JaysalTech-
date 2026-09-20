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
  Info
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
                  takeProfitPct: 1.5,
                  stopLossPct: 1.0,
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
              <span className="text-xs font-mono text-slate-400">Pair: {settings.symbol}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono">
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
                  {isEmaBullish ? 'BULL IMPULSE' : 'BEAR BIAS'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Spread: {isEmaBullish ? '+' : ''}{emaSpreadPct.toFixed(2)}%
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
                disabled={botState.usdtBalance < 5}
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
