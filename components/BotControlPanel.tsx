'use client';

import React from 'react';
import { BotSettings, BotState, StrategyType, SymbolPair } from '@/lib/types';
import { Play, Pause, RotateCcw, Zap, Sliders, ShieldCheck, AlertCircle } from 'lucide-react';

interface BotControlPanelProps {
  settings: BotSettings;
  setSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  botState: BotState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSimulateTick: (percentChange: number) => void;
  currentPrice: number;
}

export const BotControlPanel: React.FC<BotControlPanelProps> = ({
  settings,
  setSettings,
  botState,
  onStart,
  onPause,
  onReset,
  onSimulateTick,
  currentPrice,
}) => {
  const isRunning = botState.status === 'RUNNING';

  const handleStrategyChange = (strat: StrategyType) => {
    setSettings((prev) => {
      const lower = currentPrice * 0.95;
      const upper = currentPrice * 1.05;
      return {
        ...prev,
        strategy: strat,
        gridLowerPrice: Number(lower.toFixed(2)),
        gridUpperPrice: Number(upper.toFixed(2)),
      };
    });
  };

  const tranchesAvailable = Math.floor(botState.usdtBalance / settings.orderSizeUsdt);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">$7.40 Bot Configuration</h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Zero Liquidation (Spot)
        </span>
      </div>

      {/* Strategy Selectors */}
      <div>
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
          Select Bot Strategy
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Grid Bot */}
          <button
            id="strategy-grid-btn"
            onClick={() => handleStrategyChange('GRID')}
            className={`p-3 rounded-xl text-left border transition-all ${
              settings.strategy === 'GRID'
                ? 'bg-emerald-950/80 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-slate-100">Spot Grid</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300">
                Range Bound
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              Staggered buy &amp; sell orders. Profits as price oscillates in range.
            </p>
          </button>

          {/* DCA Bot */}
          <button
            id="strategy-dca-btn"
            onClick={() => handleStrategyChange('DCA')}
            className={`p-3 rounded-xl text-left border transition-all ${
              settings.strategy === 'DCA'
                ? 'bg-emerald-950/80 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-slate-100">Smart DCA</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">
                Dip Averaging
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              Buys $10 tranches on dips. Lowers average cost, exits at profit target.
            </p>
          </button>

          {/* RSI Reversal */}
          <button
            id="strategy-rsi-btn"
            onClick={() => handleStrategyChange('RSI_REVERSAL')}
            className={`p-3 rounded-xl text-left border transition-all ${
              settings.strategy === 'RSI_REVERSAL'
                ? 'bg-emerald-950/80 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-slate-100">RSI Reversal</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300">
                Oversold Bounce
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              Buys when RSI &lt; 32 (oversold) and takes profit on overbought bounce.
            </p>
          </button>

          {/* Scalp Pro */}
          <button
            id="strategy-scalp-btn"
            onClick={() => handleStrategyChange('SCALP_PRO')}
            className={`p-3 rounded-xl text-left border transition-all ${
              settings.strategy === 'SCALP_PRO'
                ? 'bg-amber-950/80 border-amber-500 text-white ring-1 ring-amber-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-amber-200">Scalp Pro</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300">
                EMA Momentum
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              Fast EMA 9/21 cross scalper with tight take-profit and stop-loss targets.
            </p>
          </button>
        </div>
      </div>

      {/* Numerical Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        {/* Order Size per tranche */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-300">Tranche Sizing (20% Balance)</label>
            <span className="text-xs font-mono font-bold text-emerald-400">
              ${(botState.usdtBalance * ((settings.orderSizePct || 20) / 100)).toFixed(2)} USDT (20%)
            </span>
          </div>
          <input
            id="input-order-size"
            type="range"
            min="10"
            max="30"
            step="5"
            value={settings.orderSizePct || 20}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                orderSizePct: Number(e.target.value),
                orderSizeUsdt: Number((botState.usdtBalance * (Number(e.target.value) / 100)).toFixed(2)),
              }))
            }
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 text-emerald-400 shrink-0" />
            Strict 20% allocation for every trade (min $1.00)
          </span>
        </div>

        {/* Take-Profit Target */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-300">Take-Profit Target</label>
            <span className="text-xs font-mono font-bold text-emerald-400">
              +{settings.takeProfitPct.toFixed(1)}% (&gt;1.2%)
            </span>
          </div>
          <input
            id="input-take-profit"
            type="range"
            min="1.5"
            max="8.0"
            step="0.1"
            value={settings.takeProfitPct}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, takeProfitPct: Number(e.target.value) }))
            }
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-[10px] text-slate-400 block mt-1">
            Net profit after 0.2% round-trip fee: ~+{(settings.takeProfitPct - 0.2).toFixed(1)}%
          </span>
        </div>

        {/* Stop-Loss or Grid Count or Leverage */}
        {settings.strategy === 'GRID' ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-300">Grid Levels (Spacing &gt;1.2%)</label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {settings.gridLevels} Grids (&gt;1.25% space)
              </span>
            </div>
            <input
              id="input-grid-levels"
              type="range"
              min="3"
              max="8"
              step="1"
              value={settings.gridLevels}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, gridLevels: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[10px] text-emerald-400/90 block mt-1">
              ✓ Spacing strictly maintained above 1.2% for fee clearance
            </span>
          </div>
        ) : settings.strategy === 'SCALP_PRO' ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-300">Scalp Timeframe &amp; Mode</label>
              <span className="text-xs font-mono font-bold text-amber-300">
                5-Min Candles
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
                5m Scalp
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500/40 text-xs font-mono text-emerald-300 font-bold">
                TP +{settings.takeProfitPct}% / SL -{settings.stopLossPct}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Active in All Market Conditions (Bullish, Ranging, Oversold)
            </span>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-300">Stop-Loss Safety</label>
              <span className="text-xs font-mono font-bold text-rose-400">
                {settings.stopLossPct > 0 ? `-${settings.stopLossPct.toFixed(1)}%` : 'Disabled (Hold)'}
              </span>
            </div>
            <input
              id="input-stop-loss"
              type="range"
              min="0"
              max="6.0"
              step="0.5"
              value={settings.stopLossPct}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, stopLossPct: Number(e.target.value) }))
              }
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Emergency stop to preserve remaining USDT
            </span>
          </div>
        )}
      </div>

      {/* Bot Run & Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              id="bot-pause-btn"
              onClick={onPause}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20"
            >
              <Pause className="w-4 h-4 fill-slate-950" />
              Pause Bot
            </button>
          ) : (
            <button
              id="bot-start-btn"
              onClick={onStart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              Start $7.40 Bot
            </button>
          )}

          <button
            id="bot-reset-btn"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700"
            title="Reset Paper Balance to 7.40 USDT"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset $7.40
          </button>
        </div>

        {/* Quick Simulation / Stress-Test Wave Triggers */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Stress Test Wave:
          </span>
          <button
            id="sim-pump-btn"
            onClick={() => onSimulateTick(2.2)}
            className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-mono text-[11px] border border-emerald-800/60"
            title="Simulate +2.2% price rise to test take-profit / grid sell"
          >
            +2.2% Up
          </button>
          <button
            id="sim-dump-btn"
            onClick={() => onSimulateTick(-2.2)}
            className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 font-mono text-[11px] border border-rose-800/60"
            title="Simulate -2.2% price dip to test DCA entry / grid buy"
          >
            -2.2% Dip
          </button>
        </div>
      </div>
    </div>
  );
};
