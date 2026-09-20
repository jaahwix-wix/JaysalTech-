'use client';

import React, { useState } from 'react';
import { BotSettings, AIStrategyAudit } from '@/lib/types';
import { Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Send } from 'lucide-react';

interface AiAuditorProps {
  settings: BotSettings;
  currentPrice: number;
}

export const AiAuditor: React.FC<AiAuditorProps> = ({ settings, currentPrice }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [audit, setAudit] = useState<AIStrategyAudit | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runAudit = async (customPrompt?: string) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: settings.strategy,
          symbol: settings.symbol,
          currentPrice,
          startingCapital: 50,
          orderSize: settings.orderSizeUsdt,
          takeProfitPct: settings.takeProfitPct,
          stopLossPct: settings.stopLossPct,
          gridCount: settings.gridLevels,
          userQuestion: customPrompt || userQuestion || undefined,
        }),
      });

      const data = await res.json();
      if (data.data) {
        setAudit(data.data);
      } else if (data.fallbackData) {
        setAudit(data.fallbackData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Audit failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
    if (score <= 6) return 'text-amber-400 bg-amber-950/80 border-amber-800';
    return 'text-rose-400 bg-rose-950/80 border-rose-800';
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border border-teal-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/20 text-teal-400 rounded-xl ring-1 ring-teal-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Quantitative Strategy Auditor</h2>
              <p className="text-xs text-slate-300">
                Audits your 50 USDT bot settings against live market conditions, fee friction, and exchange rules.
              </p>
            </div>
          </div>

          <button
            id="run-ai-audit-btn"
            onClick={() => runAudit()}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-teal-500/20"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 fill-slate-950" />
            )}
            {loading ? 'Auditing Setup...' : 'Run AI Risk Audit'}
          </button>
        </div>
      </div>

      {/* Custom Question input */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask AI anything about your 50 USDT bot (e.g., 'Is SOL or BTC better for a $50 grid?')"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runAudit(userQuestion)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
        />
        <button
          onClick={() => runAudit(userQuestion)}
          disabled={loading || !userQuestion.trim()}
          className="px-3 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Audit Results */}
      {audit ? (
        <div className="space-y-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Risk Score */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Risk Severity Score</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`text-2xl font-bold font-mono px-2.5 py-0.5 rounded border ${getScoreColor(audit.riskScore)}`}>
                  {audit.riskScore} / 10
                </span>
                <span className="text-xs text-slate-400">
                  {audit.riskScore <= 3 ? 'Low Risk' : audit.riskScore <= 6 ? 'Moderate Risk' : 'Elevated Risk'}
                </span>
              </div>
            </div>

            {/* Verdict */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Audit Verdict</span>
              <div className="mt-1 text-sm font-bold text-white line-clamp-2">
                {audit.verdict}
              </div>
            </div>

            {/* Realistic Monthly Yield */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Realistic Compounding Target</span>
              <div className="mt-1 text-base font-bold font-mono text-teal-400">
                {audit.realisticMonthlyReturn}
              </div>
            </div>
          </div>

          {/* Fee Impact Explanation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
            <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Fee Drag Analysis on $50 USDT
            </h4>
            <p className="text-slate-400 leading-relaxed font-mono">
              {audit.feeImpactExplanation}
            </p>
          </div>

          {/* Strengths & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Strengths */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Strategy Strengths
              </h4>
              <ul className="space-y-1.5 text-slate-300">
                {audit.keyStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Risks */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="font-bold text-rose-300 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Vulnerabilities for $50 Balance
              </h4>
              <ul className="space-y-1.5 text-slate-300">
                {audit.criticalRisks.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400">!</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Adjustments */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
            <h4 className="font-bold text-teal-300 mb-2 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-teal-400" />
              Recommended Parameter Adjustments
            </h4>
            <ul className="space-y-1.5 text-slate-300">
              {audit.recommendedAdjustments.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">{i + 1}.</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Advice Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <div className="font-bold text-slate-200 mb-1">Executive Summary:</div>
            <p>{audit.botAdviceSummary}</p>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center shadow-lg">
          <Sparkles className="w-12 h-12 text-teal-400/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Ready to Audit Your Bot Setup</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Click the button above to run our AI quantitative model on your 50 USDT strategy parameters ({settings.strategy} on {settings.symbol}).
          </p>
          <button
            id="run-ai-audit-cta-btn"
            onClick={() => runAudit()}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Audit Strategy Now
          </button>
        </div>
      )}
    </div>
  );
};
