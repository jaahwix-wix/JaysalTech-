'use client';

import React, { useState } from 'react';
import { BotState, ExecutedOrder, OpenGridOrder } from '@/lib/types';
import { History, Clock, ArrowDownRight, ArrowUpRight, ListFilter, CheckCircle2 } from 'lucide-react';

interface TradeLedgerProps {
  botState: BotState;
}

export const TradeLedger: React.FC<TradeLedgerProps> = ({ botState }) => {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'PENDING'>('ALL');

  const filteredHistory = botState.history.filter((trade) => {
    if (filter === 'ALL') return true;
    if (filter === 'BUY') return trade.type === 'BUY';
    if (filter === 'SELL') return trade.type === 'SELL';
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Bot Order Execution Ledger</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {botState.history.length} fills
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            id="filter-all-btn"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === 'ALL' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Fills
          </button>
          <button
            id="filter-buy-btn"
            onClick={() => setFilter('BUY')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === 'BUY' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Buys
          </button>
          <button
            id="filter-sell-btn"
            onClick={() => setFilter('SELL')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === 'SELL' ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sells
          </button>
          <button
            id="filter-pending-btn"
            onClick={() => setFilter('PENDING')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === 'PENDING' ? 'bg-slate-800 text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Open Limit ({botState.openGridOrders.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      {filter === 'PENDING' ? (
        // Open Grid Orders
        <div className="overflow-x-auto">
          {botState.openGridOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-mono">
              No open grid limit orders currently active.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Target Price</th>
                  <th className="pb-2">Order Size</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {botState.openGridOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          o.type === 'BUY'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        LIMIT {o.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-200 font-bold">
                      ${o.price < 1 ? o.price.toFixed(4) : o.price.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-slate-300">${o.amountUsdt.toFixed(2)} USDT</td>
                    <td className="py-2.5">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Pending Fill
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        // Filled Trades History
        <div className="overflow-x-auto max-h-72 overflow-y-auto pr-1">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
              <span>No orders executed yet. Click &quot;Start $7.40 Bot&quot; to begin simulation.</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Fill Price</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Fee (0.1%)</th>
                  <th className="pb-2">Net P&amp;L</th>
                  <th className="pb-2">Strategy Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHistory.map((trade) => {
                  const isBuy = trade.type === 'BUY';
                  const dateStr = new Date(trade.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={trade.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 text-slate-400 text-[11px]">{dateStr}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {isBuy ? (
                            <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-400" />
                          )}
                          {trade.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-200 font-bold">
                        ${trade.price < 1 ? trade.price.toFixed(4) : trade.price.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-slate-300">
                        ${trade.amountUsdt.toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-400">
                          ({trade.amountCoin.toFixed(4)} {trade.symbol.replace('USDT', '')})
                        </span>
                      </td>
                      <td className="py-2.5 text-amber-400">-${trade.feeUsdt.toFixed(4)}</td>
                      <td className="py-2.5 font-bold">
                        {trade.pnlUsdt !== undefined ? (
                          <span className={trade.pnlUsdt >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {trade.pnlUsdt >= 0 ? '+' : ''}${trade.pnlUsdt.toFixed(2)}{' '}
                            <span className="text-[10px]">
                              ({trade.pnlPct !== undefined && trade.pnlPct >= 0 ? '+' : ''}
                              {trade.pnlPct?.toFixed(1)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-400 text-[11px] max-w-xs truncate" title={trade.reason}>
                        {trade.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
