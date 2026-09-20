'use client';

import React, { useMemo } from 'react';
import { BotSettings, BotState, KlinePoint, SymbolPair } from '@/lib/types';
import { TrendingUp, TrendingDown, Target, ShieldAlert, Layers } from 'lucide-react';

interface PriceChartProps {
  klines: KlinePoint[];
  currentPrice: number;
  selectedSymbol: SymbolPair;
  settings: BotSettings;
  botState: BotState;
}

// Chart dimensions
const CHART_WIDTH = 800;
const CHART_HEIGHT = 340;
const CHART_PADDING = { top: 25, right: 75, bottom: 30, left: 15 };

export const PriceChart: React.FC<PriceChartProps> = ({
  klines,
  currentPrice,
  selectedSymbol,
  settings,
  botState,
}) => {
  const width = CHART_WIDTH;
  const height = CHART_HEIGHT;
  const padding = CHART_PADDING;

  // Calculate min & max with margin for overlays
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (!klines || klines.length === 0) {
      const base = currentPrice || 100;
      return { minPrice: base * 0.95, maxPrice: base * 1.05, priceRange: base * 0.1 };
    }

    let min = Math.min(...klines.map((k) => k.low), currentPrice);
    let max = Math.max(...klines.map((k) => k.high), currentPrice);

    // Also include grid bounds or TP/SL bounds
    if (settings.strategy === 'GRID') {
      const lower = settings.gridLowerPrice || currentPrice * 0.96;
      const upper = settings.gridUpperPrice || currentPrice * 1.04;
      min = Math.min(min, lower);
      max = Math.max(max, upper);
    } else if (botState.avgEntryPrice > 0) {
      const tpPrice = botState.avgEntryPrice * (1 + settings.takeProfitPct / 100);
      const slPrice = botState.avgEntryPrice * (1 - settings.stopLossPct / 100);
      min = Math.min(min, slPrice);
      max = Math.max(max, tpPrice);
    }

    // Add 2% padding
    const buffer = (max - min) * 0.04 || 1;
    const finalMin = min - buffer;
    const finalMax = max + buffer;
    return {
      minPrice: finalMin,
      maxPrice: finalMax,
      priceRange: Math.max(finalMax - finalMin, 0.0001),
    };
  }, [klines, currentPrice, settings, botState.avgEntryPrice]);

  const getY = React.useCallback(
    (val: number) => {
      const usableHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
      const normalized = (val - minPrice) / priceRange;
      return CHART_HEIGHT - CHART_PADDING.bottom - normalized * usableHeight;
    },
    [minPrice, priceRange]
  );

  const getX = React.useCallback((index: number, total: number) => {
    const usableWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    return CHART_PADDING.left + (index / Math.max(total - 1, 1)) * usableWidth;
  }, []);

  // Sparkline path
  const linePath = useMemo(() => {
    if (!klines || klines.length === 0) return '';
    return klines
      .map((k, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, klines.length)} ${getY(k.close)}`)
      .join(' ');
  }, [klines, getX, getY]);

  // Area fill under line
  const areaPath = useMemo(() => {
    if (!klines || klines.length === 0) return '';
    const bottomY = CHART_HEIGHT - CHART_PADDING.bottom;
    const points = klines
      .map((k, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, klines.length)} ${getY(k.close)}`)
      .join(' ');
    const lastX = getX(klines.length - 1, klines.length);
    const firstX = getX(0, klines.length);
    return `${points} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [klines, getX, getY]);

  const currentY = getY(currentPrice);
  const is24hUp = klines.length > 1 ? klines[klines.length - 1].close >= klines[0].open : true;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col shadow-xl">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-wide">
                {selectedSymbol.replace('USDT', '')}
                <span className="text-slate-400 text-sm font-normal">/USDT</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                15M Interval
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black font-mono text-emerald-400">
                ${currentPrice < 1 ? currentPrice.toFixed(4) : currentPrice.toFixed(2)}
              </span>
              <span
                className={`text-xs font-semibold flex items-center ${
                  is24hUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {is24hUp ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                Real-Time Spot Tick
              </span>
            </div>
          </div>
        </div>

        {/* Legend / Overlay indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {settings.strategy === 'GRID' && (
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-teal-300 border border-teal-800/50">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>{settings.gridLevels} Active Grid Bands</span>
            </span>
          )}

          {botState.avgEntryPrice > 0 && (
            <>
              <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Entry: ${botState.avgEntryPrice.toFixed(2)}</span>
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  TP (+{settings.takeProfitPct}%): $
                  {(botState.avgEntryPrice * (1 + settings.takeProfitPct / 100)).toFixed(2)}
                </span>
              </span>
              {settings.stopLossPct > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    SL (-{settings.stopLossPct}%): $
                    {(botState.avgEntryPrice * (1 - settings.stopLossPct / 100)).toFixed(2)}
                  </span>
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-950/70 border border-slate-800/70">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block select-none"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Area gradient */}
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Grid Pattern */}
            <pattern id="chartGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* Background Grid lines */}
          <rect width={width} height={height} fill="url(#chartGrid)" />

          {/* Price Axis Horizontal Ticks */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const p = minPrice + ratio * priceRange;
            const y = getY(p);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="0.75"
                />
                <text
                  x={width - padding.right + 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  ${p < 1 ? p.toFixed(4) : p.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Candlesticks & wicks */}
          {klines.map((k, i) => {
            const x = getX(i, klines.length);
            const highY = getY(k.high);
            const lowY = getY(k.low);
            const openY = getY(k.open);
            const closeY = getY(k.close);
            const isBull = k.close >= k.open;
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1.5);
            const candleColor = isBull ? '#10b981' : '#f43f5e';

            return (
              <g key={`candle-${i}`}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={candleColor}
                  strokeWidth="1"
                  opacity={0.8}
                />
                {/* Body */}
                <rect
                  x={x - 4}
                  y={bodyTop}
                  width="8"
                  height={bodyHeight}
                  fill={candleColor}
                  rx="1"
                  opacity={0.85}
                />
              </g>
            );
          })}

          {/* Gradient Area under Close */}
          {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

          {/* Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Strategy Overlays: Grid Orders */}
          {settings.strategy === 'GRID' &&
            botState.openGridOrders.map((order) => {
              const y = getY(order.price);
              if (y < padding.top || y > height - padding.bottom) return null;
              const isBuy = order.type === 'BUY';
              const color = isBuy ? '#10b981' : '#f59e0b';

              return (
                <g key={order.id}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke={color}
                    strokeWidth="1"
                    strokeDasharray={isBuy ? '4 4' : '2 2'}
                    opacity={0.7}
                  />
                  <rect
                    x={width - padding.right + 4}
                    y={y - 8}
                    width="62"
                    height="16"
                    fill={isBuy ? '#064e3b' : '#78350f'}
                    rx="3"
                  />
                  <text
                    x={width - padding.right + 7}
                    y={y + 3}
                    fill={isBuy ? '#6ee7b7' : '#fde68a'}
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {isBuy ? 'BUY' : 'SELL'} ${order.price < 1 ? order.price.toFixed(3) : order.price.toFixed(1)}
                  </text>
                </g>
              );
            })}

          {/* DCA/RSI: Average Entry Price line */}
          {botState.avgEntryPrice > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={getY(botState.avgEntryPrice)}
                x2={width - padding.right}
                y2={getY(botState.avgEntryPrice)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />
              <rect
                x={width - padding.right + 4}
                y={getY(botState.avgEntryPrice) - 8}
                width="64"
                height="16"
                fill="#0c4a6e"
                rx="3"
              />
              <text
                x={width - padding.right + 7}
                y={getY(botState.avgEntryPrice) + 3}
                fill="#7dd3fc"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                ENTRY ${botState.avgEntryPrice.toFixed(2)}
              </text>

              {/* Take-profit line */}
              {(() => {
                const tp = botState.avgEntryPrice * (1 + settings.takeProfitPct / 100);
                const tpY = getY(tp);
                return (
                  <g>
                    <line
                      x1={padding.left}
                      y1={tpY}
                      x2={width - padding.right}
                      y2={tpY}
                      stroke="#10b981"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <rect
                      x={width - padding.right + 4}
                      y={tpY - 8}
                      width="64"
                      height="16"
                      fill="#064e3b"
                      rx="3"
                    />
                    <text
                      x={width - padding.right + 7}
                      y={tpY + 3}
                      fill="#a7f3d0"
                      fontSize="8.5"
                      fontFamily="monospace"
                    >
                      TP ${tp.toFixed(2)}
                    </text>
                  </g>
                );
              })()}

              {/* Stop-loss line */}
              {settings.stopLossPct > 0 &&
                (() => {
                  const sl = botState.avgEntryPrice * (1 - settings.stopLossPct / 100);
                  const slY = getY(sl);
                  return (
                    <g>
                      <line
                        x1={padding.left}
                        y1={slY}
                        x2={width - padding.right}
                        y2={slY}
                        stroke="#f43f5e"
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                      />
                      <rect
                        x={width - padding.right + 4}
                        y={slY - 8}
                        width="64"
                        height="16"
                        fill="#881337"
                        rx="3"
                      />
                      <text
                        x={width - padding.right + 7}
                        y={slY + 3}
                        fill="#fecdd3"
                        fontSize="8.5"
                        fontFamily="monospace"
                      >
                        SL ${sl.toFixed(2)}
                      </text>
                    </g>
                  );
                })()}
            </g>
          )}

          {/* Current Live Price Line & Marker */}
          <line
            x1={padding.left}
            y1={currentY}
            x2={width - padding.right}
            y2={currentY}
            stroke="#10b981"
            strokeWidth="1.5"
          />
          <circle cx={width - padding.right} cy={currentY} r="4" fill="#10b981" />
          <rect
            x={width - padding.right + 4}
            y={currentY - 10}
            width="68"
            height="20"
            fill="#10b981"
            rx="4"
          />
          <text
            x={width - padding.right + 8}
            y={currentY + 4}
            fill="#022c22"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            ${currentPrice < 1 ? currentPrice.toFixed(4) : currentPrice.toFixed(2)}
          </text>

          {/* Execution History Markers on Chart */}
          {botState.history.slice(0, 8).map((trade, idx) => {
            const tradeY = getY(trade.price);
            const tradeX = getX(Math.max(0, klines.length - 1 - idx * 2), klines.length);
            const isBuy = trade.type === 'BUY';

            return (
              <g key={trade.id} className="cursor-pointer">
                <circle
                  cx={tradeX}
                  cy={tradeY}
                  r="6"
                  fill={isBuy ? '#10b981' : '#f43f5e'}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <text
                  x={tradeX}
                  y={tradeY + (isBuy ? 14 : -10)}
                  fill={isBuy ? '#34d399' : '#fb7185'}
                  fontSize="7.5"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {isBuy ? 'B' : 'S'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
