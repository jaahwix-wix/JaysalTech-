'use client';

import React from 'react';
import { BotSettings, BotState } from '@/lib/types';
import { Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Percent, ReceiptText } from 'lucide-react';

interface PortfolioStatsProps {
  botState: BotState;
  settings: BotSettings;
  currentPrice: number;
}

export const PortfolioStats: React.FC<PortfolioStatsProps> = ({
  botState,
  settings,
  currentPrice,
}) => {
  const cryptoValue = botState.cryptoBalance * currentPrice;
  const totalEquity = botState.usdtBalance + cryptoValue;
  const totalPnl = totalEquity - settings.initialBalance;
  const totalPnlPct = (totalPnl / settings.initialBalance) * 100;
  const isPositive = totalPnl >= 0;

  const unrealizedPnl =
    botState.cryptoBalance > 0 && botState.avgEntryPrice > 0
      ? (currentPrice - botState.avgEntryPrice) * botState.cryptoBalance
      : 0;
  const unrealizedPct =
    botState.avgEntryPrice > 0
      ? ((currentPrice - botState.avgEntryPrice) / botState.avgEntryPrice) * 100
      : 0;

  const winRate =
    botState.totalTrades > 0
      ? ((botState.winningTrades / Math.max(botState.winningTrades + botState.losingTrades, 1)) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Net Equity */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Net Portfolio Equity</span>
          <Wallet className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-1">
          <div className="text-xl font-bold font-mono text-white">
            ${totalEquity.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={`text-xs font-semibold flex items-center font-mono ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}
              ${totalPnl.toFixed(2)} ({isPositive ? '+' : ''}
              {totalPnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-2 flex justify-between">
          <span>Cash: ${botState.usdtBalance.toFixed(2)}</span>
          <span>Asset: ${cryptoValue.toFixed(2)}</span>
        </div>
      </div>

      {/* 2. Realized Profit (Closed) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Realized P&amp;L</span>
          <DollarSign className="w-4 h-4 text-teal-400" />
        </div>
        <div className="mt-1">
          <div
            className={`text-xl font-bold font-mono ${
              botState.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {botState.realizedPnl >= 0 ? '+' : ''}
            ${botState.realizedPnl.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Locked in from {botState.winningTrades} wins / {botState.losingTrades} losses
          </div>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-2 flex justify-between">
          <span>Unrealized:</span>
          <span className={unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)} ({unrealizedPct >= 0 ? '+' : ''}{unrealizedPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* 3. Total Trading Fees Paid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Exchange Fees Paid</span>
          <ReceiptText className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-1">
          <div className="text-xl font-bold font-mono text-amber-400">
            -${botState.totalFeesPaid.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            0.1% Spot Maker/Taker rate
          </div>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-2 flex justify-between">
          <span>Fee drag on ${settings.initialBalance.toFixed(2)}:</span>
          <span className="text-amber-300 font-mono">
            {((botState.totalFeesPaid / (settings.initialBalance || 7.4)) * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 4. Win Rate & Executions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Win Rate &amp; Trades</span>
          <Percent className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-1">
          <div className="text-xl font-bold font-mono text-white">
            {winRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {botState.totalTrades} order fills logged
          </div>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-2 flex justify-between">
          <span>Holding:</span>
          <span className="text-slate-200 font-mono">
            {botState.cryptoBalance.toFixed(4)} {settings.symbol.replace('USDT', '')}
          </span>
        </div>
      </div>
    </div>
  );
};
