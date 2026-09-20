'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Key,
  Lock,
  ArrowRight,
  Server,
  RefreshCw,
  Coins,
  FileCode2,
  SlidersHorizontal,
} from 'lucide-react';
import { BotSettings, BotState } from '@/lib/types';

interface GoLiveGatewayProps {
  settings: BotSettings;
  setSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  botState: BotState;
  currentPrice: number;
}

interface ExchangeStatusResponse {
  configured: boolean;
  exchange: string;
  status: 'NOT_CONFIGURED' | 'CONNECTED_LIVE' | 'CONNECTION_ERROR' | 'NETWORK_ERROR';
  message: string;
  canTrade?: boolean;
  canWithdraw?: boolean;
  spotUsdtBalance?: number;
  checklist?: Array<{ title: string; desc: string; done: boolean }>;
}

export const GoLiveGateway: React.FC<GoLiveGatewayProps> = ({
  settings,
  setSettings,
  botState,
  currentPrice,
}) => {
  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedPre, setCopiedPre] = useState(false);
  const [liveModeEnabled, setLiveModeEnabled] = useState(false);
  const [showKeyGuide, setShowKeyGuide] = useState(true);

  const sharedUrl = 'https://ais-pre-tyvioyoojyalzj27vcukgi-698719656797.europe-west2.run.app';
  const devUrl = 'https://ais-dev-tyvioyoojyalzj27vcukgi-698719656797.europe-west2.run.app';

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/exchange/status');
      const data: ExchangeStatusResponse = await res.json();
      setExchangeStatus(data);
      if (data.status === 'CONNECTED_LIVE') {
        setLiveModeEnabled(true);
      }
    } catch {
      setExchangeStatus({
        configured: false,
        exchange: 'binance',
        status: 'NETWORK_ERROR',
        message: 'Could not connect to exchange status endpoint.',
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/exchange/status')
      .then((res) => res.json())
      .then((data: ExchangeStatusResponse) => {
        if (!active) return;
        setExchangeStatus(data);
        if (data.status === 'CONNECTED_LIVE') {
          setLiveModeEnabled(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setExchangeStatus({
          configured: false,
          exchange: 'binance',
          status: 'NETWORK_ERROR',
          message: 'Could not connect to exchange status endpoint.',
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const copyToClipboard = (text: string, isDev: boolean) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isDev) {
        setCopiedDev(true);
        setTimeout(() => setCopiedDev(false), 2000);
      } else {
        setCopiedPre(true);
        setTimeout(() => setCopiedPre(false), 2000);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Go Live Cockpit */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Production Ready &amp; Live Hosting Online
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Go Live: Web Deployment &amp; Exchange Trading
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your algorithmic trading bot is currently hosted and accessible live on the web. Follow the instructions below to access your live web link or connect your 50 USDT spot account to a cryptocurrency exchange.
            </p>
          </div>

          {/* Quick Mode Indicator */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl w-full lg:w-auto shrink-0 space-y-3">
            <div className="text-xs text-slate-400 font-medium">Active Execution Engine:</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLiveModeEnabled(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !liveModeEnabled
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Paper Simulator (Safe 50$)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (exchangeStatus?.status !== 'CONNECTED_LIVE') {
                    fetchStatus();
                  }
                  setLiveModeEnabled(true);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  liveModeEnabled
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                Live Exchange Mode
              </button>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              {!liveModeEnabled ? (
                <span className="text-emerald-400">● Zero risk: testing real market prices with simulated orders.</span>
              ) : (
                <span className="text-rose-400 font-semibold">● Live spot execution mode active.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Web Hosting Links & Exchange Connectivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Web Hosting & Shareable URLs */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Live Web Application URLs</h3>
                <p className="text-xs text-slate-400">Accessible from any mobile phone, tablet, or browser</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
              Cloud Run Live
            </span>
          </div>

          <div className="space-y-4">
            {/* Shared Public Preview URL */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Production Shared URL (Permanent)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Publicly Accessible</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={sharedUrl}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 selection:bg-emerald-500 selection:text-slate-950 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(sharedUrl, false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors flex items-center gap-1"
                >
                  {copiedPre ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPre ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={sharedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shrink-0 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
              </div>
            </div>

            {/* Development URL */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  Development Container URL
                </span>
                <span className="text-[10px] text-blue-400 font-mono">Real-time Sandbox</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={devUrl}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 selection:bg-emerald-500 selection:text-slate-950 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(devUrl, true)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors flex items-center gap-1"
                >
                  {copiedDev ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDev ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={devUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2 text-slate-400">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Continuous 24/7 Hosting:
            </div>
            <p className="leading-relaxed">
              This application is containerized on Google Cloud Run. You can close your browser tab or open it on your smartphone at any time using the shared link above.
            </p>
          </div>
        </div>

        {/* Card 2: Live Exchange API Authentication Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Exchange Connection Engine</h3>
                <p className="text-xs text-slate-400">Binance / Bybit Spot API gateway</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} />
              Ping
            </button>
          </div>

          {/* Connection Status Box */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Server Authentication Status:</span>
              {loadingStatus ? (
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-400" /> Checking...
                </span>
              ) : exchangeStatus?.status === 'CONNECTED_LIVE' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Live Authenticated
                </span>
              ) : exchangeStatus?.status === 'CONNECTION_ERROR' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800">
                  <AlertTriangle className="w-3 h-3" /> Credential Error
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800">
                  <Lock className="w-3 h-3" /> Keys Not Injected
                </span>
              )}
            </div>

            <div className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono leading-relaxed">
              {exchangeStatus?.message || 'Ready to check status.'}
            </div>

            {exchangeStatus?.spotUsdtBalance !== undefined && exchangeStatus.spotUsdtBalance > 0 && (
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-xs">
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Live Spot Wallet Balance:
                </span>
                <span className="font-mono font-bold text-sm text-white">
                  ${exchangeStatus.spotUsdtBalance.toFixed(2)} USDT
                </span>
              </div>
            )}

            {/* Checklist */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Live Readiness Checklist:</div>
              {(exchangeStatus?.checklist || [
                { title: 'Create Exchange Account', desc: 'Create account on Binance or Bybit', done: false },
                { title: 'Generate Spot API Key', desc: 'Read Info + Spot Trading. Withdrawals strictly OFF.', done: false },
                { title: 'Inject EXCHANGE_API_KEY into Secrets', desc: 'Configure in AI Studio Settings menu', done: false },
                { title: 'Deposit 50 USDT on Spot', desc: 'Keep on spot wallet for micro-orders', done: false },
              ]).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-900 shrink-0 mt-0.5 flex items-center justify-center text-[10px] text-slate-500">
                      {idx + 1}
                    </div>
                  )}
                  <div>
                    <div className={item.done ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Security Guide for Connecting Real 50 USDT */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                The 3-Minute Safe API Connection Guide (Zero-Withdrawal Rule)
              </h3>
              <p className="text-xs text-slate-400">
                How to trade your 50 USDT without ever giving access to your funds
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowKeyGuide(!showKeyGuide)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showKeyGuide ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {showKeyGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Step 1 */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold flex items-center justify-center font-mono">
                1
              </div>
              <div className="font-bold text-white text-sm">Create API Key</div>
              <p className="text-slate-400 leading-relaxed">
                Log in to Binance or Bybit. Navigate to <strong>API Management</strong> &gt; <strong>Create API Key</strong> (System generated HMAC key).
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 border border-amber-800/40 rounded-2xl p-5 space-y-3">
              <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-700 text-amber-300 font-bold flex items-center justify-center font-mono">
                2
              </div>
              <div className="font-bold text-amber-300 text-sm">Strict Permissions Audit</div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Enable Reading (Checked)</span>
                </div>
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Enable Spot Trading (Checked)</span>
                </div>
                <div className="text-rose-400 font-bold flex items-center gap-1.5">
                  <span className="text-xs">✕</span>
                  <span>Enable Withdrawals (UNCHECKED!)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                With withdrawals unchecked, nobody—not even the bot—can ever transfer your funds away.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 font-bold flex items-center justify-center font-mono">
                3
              </div>
              <div className="font-bold text-white text-sm">Inject Secrets &amp; Launch</div>
              <p className="text-slate-400 leading-relaxed">
                Open AI Studio <strong>Settings</strong> &gt; <strong>Secrets</strong> panel and configure:
              </p>
              <div className="bg-slate-900 p-2 rounded-lg font-mono text-[10px] text-slate-300 space-y-1">
                <div>EXCHANGE_API_KEY=&quot;your_key&quot;</div>
                <div>EXCHANGE_API_SECRET=&quot;your_secret&quot;</div>
                <div>EXCHANGE_NAME=&quot;binance&quot;</div>
              </div>
              <p className="text-[11px] text-slate-400">
                Credentials are kept encrypted server-side and never exposed in browser scripts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Spot Kill-Switch & Capital Protection */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">Emergency Risk Protection</span>
            <span className="text-[10px] font-mono uppercase bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
              Circuit Breaker
            </span>
          </div>
          <p className="text-xs text-slate-400">
            If market volatility surges unexpectedly, the bot will automatically stop submitting new orders and preserve your remaining USDT balance.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right font-mono text-xs">
            <div className="text-slate-400 text-[10px] uppercase">Current 50$ Capital Status</div>
            <div className="font-bold text-emerald-400">
              ${(botState.usdtBalance + botState.cryptoBalance * currentPrice).toFixed(2)} USDT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
