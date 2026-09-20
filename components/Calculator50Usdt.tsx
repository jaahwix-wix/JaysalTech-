'use client';

import React, { useState } from 'react';
import { Calculator, AlertTriangle, ShieldCheck, TrendingUp, Info, Scale, DollarSign } from 'lucide-react';

export const Calculator50Usdt: React.FC = () => {
  const [initialCap, setInitialCap] = useState<number>(7.4);
  const [weeklyGainPct, setWeeklyGainPct] = useState<number>(1.5);
  const [weeks, setWeeks] = useState<number>(24);
  const [tradesPerDay, setTradesPerDay] = useState<number>(3);
  const [orderSize, setOrderSize] = useState<number>(2.0);

  // Compounding math: initialCap * (1 + weeklyGain/100)^weeks
  const finalEquity = initialCap * Math.pow(1 + weeklyGainPct / 100, weeks);
  const netGain = finalEquity - initialCap;

  // Monthly fee drag calculation
  // Each trade is orderSize * 0.1% = orderSize * 0.001
  const feePerTrade = orderSize * 0.001;
  const monthlyTrades = tradesPerDay * 30;
  const monthlyFeeTotal = monthlyTrades * feePerTrade * 2; // round trip (buy + sell)
  const feePortfolioDragPct = (monthlyFeeTotal / initialCap) * 100;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl ring-1 ring-emerald-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">$7.40 Micro-Capital Economics</h2>
              <p className="text-xs text-slate-300">
                Transparent mathematics: Micro-order thresholds, realistic compounding, and fee friction for small portfolios.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => { setInitialCap(7.4); setOrderSize(2.0); }}
                className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
                  initialCap === 7.4 ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                $7.40 Live Spot
              </button>
              <button
                type="button"
                onClick={() => { setInitialCap(50); setOrderSize(10.0); }}
                className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
                  initialCap === 50 ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                $50 Reference
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Compounding & Fee Drag */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Realistic Compounding Growth */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Realistic Compounding Simulator</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Starting: ${initialCap.toFixed(2)} USDT
              </span>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Realistic Weekly Yield Target</span>
                  <span className="font-mono font-bold text-emerald-400">+{weeklyGainPct.toFixed(1)}% / week</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.5"
                  value={weeklyGainPct}
                  onChange={(e) => setWeeklyGainPct(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0.5% (Conservative)</span>
                  <span>1.5% (Balanced Grid/DCA)</span>
                  <span>4.0% (Aggressive Volatility)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Investment Horizon</span>
                  <span className="font-mono font-bold text-emerald-400">{weeks} Weeks (~{Math.round(weeks / 4.3)} Months)</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="52"
                  step="4"
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>8 Weeks</span>
                  <span>24 Weeks (~6 mo)</span>
                  <span>52 Weeks (1 yr)</span>
                </div>
              </div>
            </div>

            {/* Result Cards */}
            <div className="grid grid-cols-2 gap-3 mt-5 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Projected Portfolio</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">${finalEquity.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400">from ${initialCap.toFixed(2)} initial</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Net Profit Gain</div>
                <div className="text-xl font-bold text-white mt-0.5">+${netGain.toFixed(2)}</div>
                <div className="text-[10px] text-emerald-400">
                  +{((netGain / initialCap) * 100).toFixed(1)}% total ROI
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
            <Info className="w-3.5 h-3.5 text-blue-400 inline mr-1" />
            Compounding modest weekly spot profits (1% to 2%) without leverage keeps capital completely protected against wipeouts.
          </p>
        </div>

        {/* 2. Fee Drag & Trade Frequency Calculator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Fee Friction on ${initialCap.toFixed(2)} Capital</h3>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                0.1% Spot Fee
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Trades per Day</span>
                  <span className="font-mono font-bold text-amber-400">{tradesPerDay} round-trips</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={tradesPerDay}
                  onChange={(e) => setTradesPerDay(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  More trades = higher exchange fee burden on small balances
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Order Tranche Size</span>
                  <span className="font-mono font-bold text-amber-400">${orderSize.toFixed(2)} USDT</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max={initialCap}
                  step="0.5"
                  value={orderSize}
                  onChange={(e) => setOrderSize(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Est. Monthly Fees</div>
                <div className="text-xl font-bold text-amber-400 mt-0.5">-${monthlyFeeTotal.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400">{monthlyTrades} round-trips/mo</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Drag on ${initialCap.toFixed(2)}</div>
                <div className="text-xl font-bold text-rose-400 mt-0.5">-{feePortfolioDragPct.toFixed(1)}%</div>
                <div className="text-[10px] text-slate-400">capital lost to fees</div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/50">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline mr-1" />
            <strong>Key Insight for ${initialCap.toFixed(2)} Capital:</strong> Avoid high-frequency micro-churning! A bot that trades 20 times a day will lose a significant portion of small capital to exchange maker/taker fees. Grid or DCA with wider profit thresholds preserves capital.
          </p>
        </div>
      </div>

      {/* 3. Spot vs Futures Comparison Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          Why You Must NEVER Run ${initialCap.toFixed(2)} on High Futures Leverage
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Futures Trap */}
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between font-bold text-rose-300 text-sm mb-2">
              <span>Futures Bot (10x - 20x Leverage)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/60 text-rose-200">
                99% Wipeout Risk
              </span>
            </div>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong>Instant Liquidation:</strong> A standard 4.8% market wick on 20x leverage results in a 100% loss. Your ${initialCap.toFixed(2)} is gone forever.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong>Funding Rate Bleed:</strong> Holding perpetual futures contracts incurs funding fees every 8 hours, silently depleting your balance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong>Emotional Burnout:</strong> Getting liquidated induces panic, leading to chasing losses.</span>
              </li>
            </ul>
          </div>

          {/* Safe Spot */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between font-bold text-emerald-300 text-sm mb-2">
              <span>Spot Bot (0x Leverage - What We Run Here)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200">
                Zero Liquidation
              </span>
            </div>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>No Margin Calls:</strong> If SOL drops 5%, you still own your coins! There is no liquidation price.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>DCA Advantage:</strong> As price drops, the bot averages your entry price down, allowing you to profit quickly when price bounces.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Zero Overnight Funding Fees:</strong> You can hold for days, weeks, or months with zero recurring carrying costs.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
