'use client';

import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Key, ExternalLink, HelpCircle } from 'lucide-react';

export const SecurityShield: React.FC = () => {
  const [testPermissions, setTestPermissions] = useState<{
    reading: boolean;
    spotTrading: boolean;
    withdrawals: boolean;
    transfers: boolean;
  }>({
    reading: true,
    spotTrading: true,
    withdrawals: false,
    transfers: false,
  });

  const isConfigSecure =
    testPermissions.reading &&
    testPermissions.spotTrading &&
    !testPermissions.withdrawals &&
    !testPermissions.transfers;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl ring-1 ring-emerald-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Bot Security Shield &amp; Anti-Scam Guide</h2>
              <p className="text-xs text-slate-300">
                Protecting your 50 USDT from phishing, withdrawal drainers, and fake bot schemes.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Non-Custodial Architecture
          </span>
        </div>
      </div>

      {/* Interactive API Key Security Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Interactive Exchange API Key Permissions Auditor</h3>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
              isConfigSecure
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
            }`}
          >
            {isConfigSecure ? 'CONFIG: SECURE' : 'DANGER: CAPITAL AT RISK'}
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          When configuring an algorithmic bot on exchanges like Binance, Bybit, or OKX, your API permissions dictate what the bot is allowed to do. Toggle the permissions below to test security status:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Read */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
            <div>
              <div className="text-xs font-bold text-slate-200">Enable Reading</div>
              <div className="text-[10px] text-slate-400">Allows bot to fetch wallet balances and orders</div>
            </div>
            <input
              type="checkbox"
              checked={testPermissions.reading}
              onChange={(e) => setTestPermissions((p) => ({ ...p, reading: e.target.checked }))}
              className="accent-emerald-500 w-4 h-4 rounded"
            />
          </label>

          {/* Spot Trading */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
            <div>
              <div className="text-xs font-bold text-slate-200">Enable Spot Trading</div>
              <div className="text-[10px] text-slate-400">Allows placing spot buy and sell limit orders</div>
            </div>
            <input
              type="checkbox"
              checked={testPermissions.spotTrading}
              onChange={(e) => setTestPermissions((p) => ({ ...p, spotTrading: e.target.checked }))}
              className="accent-emerald-500 w-4 h-4 rounded"
            />
          </label>

          {/* Withdrawals (DANGER) */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-rose-950/30 border border-rose-900/60 cursor-pointer hover:border-rose-800">
            <div>
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Enable Withdrawals
              </div>
              <div className="text-[10px] text-rose-400">Allows withdrawing crypto to external wallets</div>
            </div>
            <input
              type="checkbox"
              checked={testPermissions.withdrawals}
              onChange={(e) => setTestPermissions((p) => ({ ...p, withdrawals: e.target.checked }))}
              className="accent-rose-500 w-4 h-4 rounded"
            />
          </label>

          {/* Internal Transfers */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
            <div>
              <div className="text-xs font-bold text-slate-200">Enable Universal Transfer</div>
              <div className="text-[10px] text-slate-400">Transfers between sub-accounts or futures margin</div>
            </div>
            <input
              type="checkbox"
              checked={testPermissions.transfers}
              onChange={(e) => setTestPermissions((p) => ({ ...p, transfers: e.target.checked }))}
              className="accent-amber-500 w-4 h-4 rounded"
            />
          </label>
        </div>

        {/* Security Diagnosis */}
        {testPermissions.withdrawals ? (
          <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-start gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-rose-300">CRITICAL VULNERABILITY: Withdrawals Enabled!</strong>
              A legitimate trading bot NEVER needs withdrawal permission. If you enable this, any compromised server or malicious script can steal your 50 USDT instantly. Keep withdrawals STRICTLY UNCHECKED!
            </div>
          </div>
        ) : isConfigSecure ? (
          <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-emerald-300">Perfect API Security Configuration!</strong>
              The bot can analyze the market and execute spot trades, but it cannot withdraw or transfer your crypto. Even in a worst-case security event, your capital cannot be stolen out of your account.
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-950/70 border border-amber-800 rounded-xl text-xs text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300">Missing Required Permissions</strong>
              Enable both &quot;Reading&quot; and &quot;Spot Trading&quot; for a bot to execute orders.
            </div>
          </div>
        )}
      </div>

      {/* 3 Vital Anti-Scam Rules for 50 USDT Traders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Scam #1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>1. Telegram &quot;Doubling&quot; Bots</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>The Trap:</strong> Channels promise: <em>&quot;Deposit 50 USDT to this automated AI bot wallet and receive 5 USDT daily profit.&quot;</em>
            </p>
            <p className="text-slate-400 mt-2 leading-relaxed">
              <strong>The Reality:</strong> This is a 100% Ponzi exit scam. Once you send USDT to their address, you will never get it back.
            </p>
          </div>
          <div className="mt-3 text-[10px] text-emerald-400 font-mono font-semibold">
            Rule: Keep funds inside your own Tier-1 exchange account only.
          </div>
        </div>

        {/* Scam #2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>2. High-Gas On-Chain DEX Bots</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>The Trap:</strong> Running Uniswap / Ethereum meme-coin bots with 50 USDT.
            </p>
            <p className="text-slate-400 mt-2 leading-relaxed">
              <strong>The Reality:</strong> Ethereum gas fees ($5 - $15 per swap) and honeypot token taxes (99% sell fee) will completely evaporate $50 in just 2 transactions.
            </p>
          </div>
          <div className="mt-3 text-[10px] text-emerald-400 font-mono font-semibold">
            Rule: Stick to CEX Spot (Binance, Bybit) with 0.1% fees on 50 USDT.
          </div>
        </div>

        {/* Scam #3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>3. IP Address Whitelisting</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>The Protection:</strong> Always restrict API keys to your trusted IP address or VPS IP.
            </p>
            <p className="text-slate-400 mt-2 leading-relaxed">
              <strong>The Benefit:</strong> If someone steals your API key string, they still cannot use it because their requests will be rejected by the exchange from unauthorized IPs.
            </p>
          </div>
          <div className="mt-3 text-[10px] text-emerald-400 font-mono font-semibold">
            Rule: Never leave API keys set to &quot;Unrestricted IP&quot;.
          </div>
        </div>
      </div>

      {/* Exchange Minimum Order Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          Major Exchange Minimum Order Sizes for 50 USDT Traders
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2">Exchange</th>
                <th className="pb-2">Min Spot Order</th>
                <th className="pb-2">Base Spot Fee</th>
                <th className="pb-2">50 USDT Max Grids</th>
                <th className="pb-2">Security Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 font-bold text-white">Binance</td>
                <td className="py-2.5 text-emerald-400 font-bold">$5.00 USDT</td>
                <td className="py-2.5">0.10% (0.075% with BNB)</td>
                <td className="py-2.5">5 - 10 grids</td>
                <td className="py-2.5 text-emerald-400">★★★★★ (Tier 1)</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 font-bold text-white">Bybit</td>
                <td className="py-2.5 text-emerald-400 font-bold">$1.00 - $5.00</td>
                <td className="py-2.5">0.10%</td>
                <td className="py-2.5">5 - 10 grids</td>
                <td className="py-2.5 text-emerald-400">★★★★★ (Tier 1)</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 font-bold text-white">OKX</td>
                <td className="py-2.5 text-emerald-400 font-bold">$1.00 - $5.00</td>
                <td className="py-2.5">0.08% maker / 0.10% taker</td>
                <td className="py-2.5">5 - 10 grids</td>
                <td className="py-2.5 text-emerald-400">★★★★★ (Tier 1)</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 font-bold text-white">KuCoin</td>
                <td className="py-2.5 text-emerald-400 font-bold">$1.00 - $5.00</td>
                <td className="py-2.5">0.10%</td>
                <td className="py-2.5">5 - 10 grids</td>
                <td className="py-2.5 text-teal-400">★★★★☆ (Tier 1)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
