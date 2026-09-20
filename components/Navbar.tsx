'use client';

import React from 'react';
import { MarketTicker, SymbolPair } from '@/lib/types';
import { ShieldCheck, TrendingUp, TrendingDown, Bot, Wallet, Sparkles, Calculator, Lock, Zap, Radio } from 'lucide-react';

interface NavbarProps {
  tickers: MarketTicker[];
  selectedSymbol: SymbolPair;
  onSelectSymbol: (symbol: SymbolPair) => void;
  activeTab: 'simulator' | 'scalp' | 'calculator' | 'auditor' | 'security' | 'golive';
  setActiveTab: (tab: 'simulator' | 'scalp' | 'calculator' | 'auditor' | 'security' | 'golive') => void;
  botStatus: 'STOPPED' | 'RUNNING' | 'PAUSED';
  totalEquity: number;
  initialBalance: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  tickers,
  selectedSymbol,
  onSelectSymbol,
  activeTab,
  setActiveTab,
  botStatus,
  totalEquity,
  initialBalance,
}) => {
  const pnlTotal = totalEquity - initialBalance;
  const pnlPct = ((totalEquity - initialBalance) / initialBalance) * 100;
  const isProfit = pnlTotal >= 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800/80 text-slate-100">
      {/* Top Bar: Live Tickers Strip */}
      <div className="border-b border-slate-900 bg-slate-950/80 px-4 py-1.5 overflow-x-auto scrollbar-none flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold uppercase tracking-wider shrink-0 pr-2 border-r border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Market
        </div>

        <div className="flex items-center gap-3">
          {tickers.map((t) => {
            const isSelected = t.symbol === selectedSymbol;
            const isUp = t.change24h >= 0;
            return (
              <button
                key={t.symbol}
                id={`ticker-btn-${t.symbol}`}
                onClick={() => onSelectSymbol(t.symbol as SymbolPair)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded transition-colors ${
                  isSelected
                    ? 'bg-slate-800 text-emerald-300 font-bold ring-1 ring-emerald-500/50'
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                <span>{t.symbol.replace('USDT', '/USDT')}</span>
                <span className="font-sans font-medium text-slate-100">
                  ${t.price < 1 ? t.price.toFixed(4) : t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className={`flex items-center text-[10px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {isUp ? '+' : ''}
                  {t.change24h.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Bot Badge */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
            <Bot className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                CryptoBot <span className="text-emerald-400 font-mono">$7.40</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                Spot Safe (0x Leverage)
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Algorithmic micro-capital paper trader &amp; fee risk optimizer
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            id="tab-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'simulator'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Bot Engine</span>
          </button>
          <button
            id="tab-scalp"
            onClick={() => setActiveTab('scalp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'scalp'
                ? 'bg-amber-400 text-slate-950 font-bold shadow'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-amber-400" />
            <span>Scalp Pro (100% Lab)</span>
          </button>
          <button
            id="tab-calculator"
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'calculator'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>50$ Yield &amp; Fees</span>
          </button>
          <button
            id="tab-auditor"
            onClick={() => setActiveTab('auditor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'auditor'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Auditor</span>
          </button>
          <button
            id="tab-security"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'security'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security Shield</span>
          </button>
          <button
            id="tab-golive"
            onClick={() => setActiveTab('golive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-bold ${
              activeTab === 'golive'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Go Live 🚀</span>
          </button>
        </div>

        {/* Live Balance / Equity Display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs">
            <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Equity Value</div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-sm text-slate-100">${totalEquity.toFixed(2)}</span>
                <span className={`text-[11px] font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isProfit ? '+' : ''}
                  {pnlTotal.toFixed(2)} ({isProfit ? '+' : ''}
                  {pnlPct.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider ${
              botStatus === 'RUNNING'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : botStatus === 'PAUSED'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {botStatus === 'RUNNING' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  botStatus === 'RUNNING'
                    ? 'bg-emerald-400'
                    : botStatus === 'PAUSED'
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              />
            </span>
            <span>{botStatus === 'RUNNING' ? 'LIVE 5M BOT' : botStatus}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
