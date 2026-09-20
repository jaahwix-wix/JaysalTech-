'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BotSettings,
  BotState,
  ExecutedOrder,
  KlinePoint,
  MarketTicker,
  SymbolPair,
} from '@/lib/types';
import { executeBotTick, generateGridOrders } from '@/lib/simulation';
import { Navbar } from '@/components/Navbar';
import { PriceChart } from '@/components/PriceChart';
import { BotControlPanel } from '@/components/BotControlPanel';
import { PortfolioStats } from '@/components/PortfolioStats';
import { TradeLedger } from '@/components/TradeLedger';
import { Calculator50Usdt } from '@/components/Calculator50Usdt';
import { AiAuditor } from '@/components/AiAuditor';
import { SecurityShield } from '@/components/SecurityShield';
import { ScalpProCockpit } from '@/components/ScalpProCockpit';
import { GoLiveGateway } from '@/components/GoLiveGateway';
import { Bell, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

const DEFAULT_SETTINGS: BotSettings = {
  strategy: 'GRID',
  symbol: 'SOLUSDT',
  initialBalance: 7.4,
  orderSizeUsdt: 2.0,
  takeProfitPct: 2.5,
  stopLossPct: 3.0,
  gridLevels: 3,
  gridLowerPrice: 0,
  gridUpperPrice: 0,
  dipTriggerPct: 1.5,
  feePct: 0.1, // 0.1% spot fee
  leverage: 1,
  scalpEmaFast: 9,
  scalpEmaSlow: 21,
  scalpTrailingStop: true,
};

const INITIAL_BOT_STATE: BotState = {
  status: 'STOPPED',
  usdtBalance: 7.4,
  cryptoBalance: 0,
  avgEntryPrice: 0,
  realizedPnl: 0,
  totalFeesPaid: 0,
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  history: [],
  openGridOrders: [],
  lastActionTime: 0,
  lastCheckPrice: 0,
  dcaTranchesUsed: 0,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'scalp' | 'calculator' | 'auditor' | 'security' | 'golive'>('simulator');
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [klines, setKlines] = useState<KlinePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(185.5);
  const [settings, setSettings] = useState<BotSettings>(DEFAULT_SETTINGS);
  const [botState, setBotState] = useState<BotState>(INITIAL_BOT_STATE);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((title: string, desc: string, type: 'success' | 'info' | 'warn' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage({ title, desc, type });
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Polling market data every 4 seconds
  useEffect(() => {
    let active = true;

    const poll = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await fetch(`/api/market?symbol=${settings.symbol}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        if (data.tickers && data.tickers.length > 0) {
          setTickers(data.tickers);
          const match = data.tickers.find((t: MarketTicker) => t.symbol === settings.symbol);
          if (match) {
            setCurrentPrice(match.price);
          }
        }

        if (data.klines && data.klines.length > 0) {
          setKlines(data.klines);
        }
      } catch (err) {
        console.warn('Market fetch error, continuing with cached price:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [settings.symbol]);

  // When symbol changes, update price and grid bounds if grid strategy
  const handleSelectSymbol = (newSymbol: SymbolPair) => {
    setSettings((prev) => ({ ...prev, symbol: newSymbol }));
    const match = tickers.find((t) => t.symbol === newSymbol);
    const newPrice = match ? match.price : currentPrice;
    setCurrentPrice(newPrice);

    if (botState.status === 'RUNNING' && settings.strategy === 'GRID') {
      const newGrids = generateGridOrders(newPrice, { ...settings, symbol: newSymbol }, botState.usdtBalance);
      setBotState((prev) => ({ ...prev, openGridOrders: newGrids }));
    }
  };

  // 2. Bot Tick Runner
  useEffect(() => {
    if (botState.status !== 'RUNNING') return;

    // Run tick check every 2.5 seconds with live price
    const timer = setInterval(() => {
      // Add a slight natural live micro-fluctuation to mirror real tick volume
      const microJitter = (Math.random() - 0.5) * 0.002 * currentPrice;
      const tickPrice = Number((currentPrice + microJitter).toFixed(4));

      setBotState((prevState) => {
        const { nextState, newTrade } = executeBotTick(prevState, settings, tickPrice, klines);

        if (newTrade) {
          if (newTrade.type === 'BUY') {
            showToast(
              `Filled BUY Order on ${newTrade.symbol}`,
              `Bought $${newTrade.amountUsdt.toFixed(2)} at $${newTrade.price.toFixed(2)} (${newTrade.reason})`,
              'info'
            );
          } else {
            const isProfit = (newTrade.pnlUsdt || 0) >= 0;
            showToast(
              `Filled SELL Order (${isProfit ? 'PROFIT TAKEN' : 'STOPPED OUT'})`,
              `Sold for $${newTrade.amountUsdt.toFixed(2)} with net PnL ${isProfit ? '+' : ''}$${newTrade.pnlUsdt?.toFixed(2)} (${newTrade.reason})`,
              isProfit ? 'success' : 'warn'
            );
          }
        }

        return nextState;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [botState.status, settings, currentPrice, klines, showToast]);

  // Start Bot Handler
  const handleStartBot = () => {
    let initialGrids = botState.openGridOrders;
    if (settings.strategy === 'GRID') {
      initialGrids = generateGridOrders(currentPrice, settings, botState.usdtBalance);
    }

    setBotState((prev) => ({
      ...prev,
      status: 'RUNNING',
      openGridOrders: initialGrids,
      lastCheckPrice: currentPrice,
    }));

    showToast(
      'Trading Bot Activated',
      `Running ${settings.strategy} on ${settings.symbol} with $7.40 paper capital. Monitoring live ticks...`,
      'success'
    );
  };

  // Pause Bot Handler
  const handlePauseBot = () => {
    setBotState((prev) => ({ ...prev, status: 'PAUSED' }));
    showToast('Bot Paused', 'Order matching paused. Current holdings are preserved.', 'info');
  };

  // Reset Bot State
  const handleResetBot = () => {
    setBotState({
      ...INITIAL_BOT_STATE,
      usdtBalance: 7.4,
      openGridOrders: [],
    });
    showToast('Reset Complete', 'Wallet balance restored to exactly 7.40 USDT paper funds.', 'info');
  };

  // Interactive Stress-Test Wave Simulation
  const handleSimulateWave = (percentChange: number) => {
    const adjustedPrice = currentPrice * (1 + percentChange / 100);
    setCurrentPrice(adjustedPrice);

    // Also append to klines
    setKlines((prev) => {
      const now = Date.now();
      const newCandle: KlinePoint = {
        time: now,
        open: currentPrice,
        high: Math.max(currentPrice, adjustedPrice),
        low: Math.min(currentPrice, adjustedPrice),
        close: adjustedPrice,
        volume: 250000,
      };
      return [...prev.slice(1), newCandle];
    });

    if (botState.status === 'RUNNING') {
      setBotState((prevState) => {
        const { nextState, newTrade } = executeBotTick(prevState, settings, adjustedPrice, klines);
        if (newTrade) {
          showToast(
            `Wave Triggered ${newTrade.type} Order!`,
            `${newTrade.type} filled at $${newTrade.price.toFixed(2)} (${newTrade.reason})`,
            newTrade.type === 'SELL' && (newTrade.pnlUsdt || 0) >= 0 ? 'success' : 'info'
          );
        }
        return nextState;
      });
    }
  };

  const handleClosePosition = () => {
    if (botState.cryptoBalance <= 0) return;
    const grossUsdt = botState.cryptoBalance * currentPrice;
    const fee = grossUsdt * (settings.feePct / 100);
    const lev = Math.max(1, settings.leverage || 1);
    const marginCost = (botState.cryptoBalance * botState.avgEntryPrice) / lev;
    const rawProfit = (currentPrice - botState.avgEntryPrice) * botState.cryptoBalance;
    const netReturn = Math.max(0, marginCost + rawProfit - fee);
    const netPnl = netReturn - marginCost;

    const exitOrder: ExecutedOrder = {
      id: `manual-exit-${Date.now()}`,
      timestamp: Date.now(),
      symbol: settings.symbol,
      type: 'SELL',
      price: currentPrice,
      amountUsdt: netReturn,
      amountCoin: botState.cryptoBalance,
      feeUsdt: fee,
      pnlUsdt: netPnl,
      pnlPct: botState.avgEntryPrice > 0 ? ((currentPrice - botState.avgEntryPrice) / botState.avgEntryPrice) * 100 * lev : 0,
      reason: `Manual position close at market ($${currentPrice.toFixed(2)})`,
    };

    setBotState((prev) => ({
      ...prev,
      usdtBalance: prev.usdtBalance + netReturn,
      cryptoBalance: 0,
      avgEntryPrice: 0,
      realizedPnl: prev.realizedPnl + netPnl,
      totalFeesPaid: prev.totalFeesPaid + fee,
      totalTrades: prev.totalTrades + 1,
      winningTrades: netPnl >= 0 ? prev.winningTrades + 1 : prev.winningTrades,
      losingTrades: netPnl < 0 ? prev.losingTrades + 1 : prev.losingTrades,
      history: [exitOrder, ...prev.history.slice(0, 49)],
    }));

    showToast(
      'Position Closed',
      `Closed ${botState.cryptoBalance.toFixed(4)} ${settings.symbol}. Net PnL: ${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)}`,
      netPnl >= 0 ? 'success' : 'warn'
    );
  };

  const handleInstantTrade = (type: 'BUY' | 'SELL', customReason?: string) => {
    if (type === 'BUY') {
      if (botState.usdtBalance < 5) {
        showToast('Insufficient USDT', 'Need at least 5 USDT to open a position', 'warn');
        return;
      }
      const lev = Math.max(1, settings.leverage || 1);
      const margin = Math.min(settings.orderSizeUsdt, botState.usdtBalance);
      const notional = margin * lev;
      const fee = notional * (settings.feePct / 100);
      const coinBought = (notional - fee) / currentPrice;

      const trade: ExecutedOrder = {
        id: `manual-buy-${Date.now()}`,
        timestamp: Date.now(),
        symbol: settings.symbol,
        type: 'BUY',
        price: currentPrice,
        amountUsdt: margin,
        amountCoin: coinBought,
        feeUsdt: fee,
        reason: customReason || `Manual Buy at $${currentPrice.toFixed(2)} (${lev}x lev)`,
      };

      setBotState((prev) => {
        const prevCost = prev.cryptoBalance * prev.avgEntryPrice;
        const newCost = prevCost + margin * lev;
        const newCrypto = prev.cryptoBalance + coinBought;
        return {
          ...prev,
          usdtBalance: prev.usdtBalance - margin,
          cryptoBalance: newCrypto,
          avgEntryPrice: newCost / newCrypto,
          totalFeesPaid: prev.totalFeesPaid + fee,
          totalTrades: prev.totalTrades + 1,
          history: [trade, ...prev.history.slice(0, 49)],
        };
      });

      showToast('Scalp Long Opened', `Allocated $${margin} USDT @ $${currentPrice.toFixed(2)} (${lev}x Lev)`, 'info');
    } else {
      handleClosePosition();
    }
  };

  // Total Equity calculation
  const totalEquity = botState.usdtBalance + botState.cryptoBalance * currentPrice;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation & Live Ticker Strip */}
      <Navbar
        tickers={tickers}
        selectedSymbol={settings.symbol}
        onSelectSymbol={handleSelectSymbol}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        botStatus={botState.status}
        totalEquity={totalEquity}
        initialBalance={settings.initialBalance}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 border-emerald-500/50 text-slate-100'
                : toastMessage.type === 'warn'
                ? 'bg-slate-900 border-rose-500/50 text-slate-100'
                : 'bg-slate-900 border-blue-500/50 text-slate-100'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toastMessage.type === 'warn' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Bell className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="font-bold text-white mb-0.5">{toastMessage.title}</div>
              <div className="text-slate-300 leading-relaxed font-mono">{toastMessage.desc}</div>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-500 hover:text-slate-300 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            {/* Strategy Preset Chips */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-200">$7.40 Strategy Presets:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="preset-sol-grid-btn"
                  onClick={() => {
                    handleSelectSymbol('SOLUSDT');
                    setSettings((p) => ({
                      ...p,
                      strategy: 'GRID',
                      orderSizeUsdt: 1.8,
                      takeProfitPct: 2.5,
                      gridLevels: 4,
                    }));
                    showToast('Preset Loaded', 'Conservative SOL Micro-Grid ($1.80/order, 4 grids)', 'info');
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
                >
                  ⚡ Active SOL Grid (4 Grids)
                </button>
                <button
                  id="preset-btc-dca-btn"
                  onClick={() => {
                    handleSelectSymbol('BTCUSDT');
                    setSettings((p) => ({
                      ...p,
                      strategy: 'DCA',
                      orderSizeUsdt: 2.0,
                      takeProfitPct: 3.0,
                      dipTriggerPct: 1.5,
                    }));
                    showToast('Preset Loaded', 'Safe BTC Micro-DCA ($2.00 tranches on 1.5% dips)', 'info');
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition-colors"
                >
                  🛡️ Safe BTC Micro-DCA
                </button>
                <button
                  id="preset-eth-rsi-btn"
                  onClick={() => {
                    handleSelectSymbol('ETHUSDT');
                    setSettings((p) => ({
                      ...p,
                      strategy: 'RSI_REVERSAL',
                      orderSizeUsdt: 2.5,
                      takeProfitPct: 3.5,
                      stopLossPct: 2.5,
                    }));
                    showToast('Preset Loaded', 'ETH Oversold Reversal (RSI < 32 buy, $2.50 order)', 'info');
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 transition-colors"
                >
                  📈 ETH RSI Reversal
                </button>
                <button
                  id="preset-scalp-pro-btn"
                  onClick={() => {
                    handleSelectSymbol('SOLUSDT');
                    setSettings((p) => ({
                      ...p,
                      strategy: 'SCALP_PRO',
                      orderSizeUsdt: 2.0,
                      takeProfitPct: 1.5,
                      stopLossPct: 1.0,
                      leverage: 3,
                    }));
                    setActiveTab('scalp');
                    showToast('Preset Loaded', 'SOL Scalp Pro Momentum (EMA 9/21 cross, 3x lev, $2.00 order)', 'info');
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-mono bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-600/60 transition-colors flex items-center gap-1 font-bold"
                >
                  <Zap className="w-3 h-3 fill-amber-300" />
                  Scalp Pro (100% Lab)
                </button>
              </div>
            </div>

            {/* Top Stats Overview */}
            <PortfolioStats
              botState={botState}
              settings={settings}
              currentPrice={currentPrice}
            />

            {/* Main Interactive Grid: Chart & Bot Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Live Chart & Bot Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <PriceChart
                  klines={klines}
                  currentPrice={currentPrice}
                  selectedSymbol={settings.symbol}
                  settings={settings}
                  botState={botState}
                />
                <BotControlPanel
                  settings={settings}
                  setSettings={setSettings}
                  botState={botState}
                  onStart={handleStartBot}
                  onPause={handlePauseBot}
                  onReset={handleResetBot}
                  onSimulateTick={handleSimulateWave}
                  currentPrice={currentPrice}
                />
              </div>

              {/* Right Column: Execution History & Order Book (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <TradeLedger botState={botState} />

                {/* Micro-Capital Safety Callout */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 text-slate-300">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    How this bot secures your $7.40 capital:
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    1. <strong>Spot Only (0x leverage):</strong> No liquidation wick can ever zero your account.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    2. <strong>Real Fee Deduction:</strong> Simulates exchange 0.1% fee on every order so you never see illusory profits.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    3. <strong>Micro-Tranche Sizing ($1.50 - $2.50):</strong> Staggers entries across multiple levels without exhausting micro-capital.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scalp' && (
          <div className="space-y-6">
            <PortfolioStats
              botState={botState}
              settings={settings}
              currentPrice={currentPrice}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-6">
                <PriceChart
                  klines={klines}
                  currentPrice={currentPrice}
                  selectedSymbol={settings.symbol}
                  settings={settings}
                  botState={botState}
                />
              </div>
              <div className="lg:col-span-5">
                <TradeLedger botState={botState} />
              </div>
            </div>
            <ScalpProCockpit
              settings={settings}
              setSettings={setSettings}
              botState={botState}
              currentPrice={currentPrice}
              klines={klines}
              onStartBot={handleStartBot}
              onPauseBot={handlePauseBot}
              onInstantTrade={handleInstantTrade}
              onClosePosition={handleClosePosition}
              onSimulateTick={handleSimulateWave}
            />
          </div>
        )}

        {activeTab === 'calculator' && <Calculator50Usdt />}

        {activeTab === 'auditor' && (
          <AiAuditor settings={settings} currentPrice={currentPrice} />
        )}

        {activeTab === 'security' && <SecurityShield />}

        {activeTab === 'golive' && (
          <GoLiveGateway
            settings={settings}
            setSettings={setSettings}
            botState={botState}
            currentPrice={currentPrice}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>CryptoBot $7.40 Capital — Algorithmic Risk Management Simulator</span>
          <span className="flex items-center gap-1 text-emerald-400/80">
            <ShieldCheck className="w-3.5 h-3.5" />
            Spot Non-Custodial Simulation
          </span>
        </div>
      </footer>
    </div>
  );
}
