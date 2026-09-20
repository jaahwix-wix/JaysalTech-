import { BotSettings, BotState, ExecutedOrder, KlinePoint, OpenGridOrder } from './types';

export function calculateEma(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calculateRsi(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function generateGridOrders(
  currentPrice: number,
  settings: BotSettings,
  availableUsdt: number
): OpenGridOrder[] {
  const { gridLevels, gridLowerPrice, gridUpperPrice, orderSizeUsdt } = settings;
  const lower = gridLowerPrice > 0 ? gridLowerPrice : currentPrice * 0.96;
  const upper = gridUpperPrice > 0 ? gridUpperPrice : currentPrice * 1.04;
  const step = (upper - lower) / (gridLevels - 1);

  const orders: OpenGridOrder[] = [];
  const maxBuyOrders = Math.floor(availableUsdt / orderSizeUsdt);
  let buyCount = 0;

  for (let i = 0; i < gridLevels; i++) {
    const price = lower + i * step;
    const isBuy = price < currentPrice;

    if (isBuy && buyCount < maxBuyOrders) {
      orders.push({
        id: `grid-buy-${i}-${Date.now()}`,
        type: 'BUY',
        price: Number(price.toFixed(4)),
        amountUsdt: orderSizeUsdt,
        amountCoin: orderSizeUsdt / price,
        status: 'PENDING',
      });
      buyCount++;
    } else if (!isBuy) {
      orders.push({
        id: `grid-sell-${i}-${Date.now()}`,
        type: 'SELL',
        price: Number(price.toFixed(4)),
        amountUsdt: orderSizeUsdt,
        amountCoin: orderSizeUsdt / price,
        status: 'PENDING',
      });
    }
  }

  return orders;
}

export function executeBotTick(
  state: BotState,
  settings: BotSettings,
  currentPrice: number,
  klines: KlinePoint[]
): { nextState: BotState; newTrade: ExecutedOrder | null } {
  if (state.status !== 'RUNNING') {
    return { nextState: state, newTrade: null };
  }

  const {
    strategy,
    orderSizeUsdt,
    takeProfitPct,
    stopLossPct,
    feePct,
    symbol,
    dipTriggerPct,
  } = settings;

  let next = { ...state };
  let executedTrade: ExecutedOrder | null = null;
  const now = Date.now();

  // 1. Check Stop-Loss if holding crypto
  if (next.cryptoBalance > 0 && next.avgEntryPrice > 0 && stopLossPct > 0) {
    const dropPct = ((currentPrice - next.avgEntryPrice) / next.avgEntryPrice) * 100;
    if (dropPct <= -stopLossPct) {
      // Execute emergency STOP LOSS sell
      const grossUsdt = next.cryptoBalance * currentPrice;
      const fee = grossUsdt * (feePct / 100);
      const netUsdt = grossUsdt - fee;
      const costBasis = next.cryptoBalance * next.avgEntryPrice;
      const pnl = netUsdt - costBasis;

      executedTrade = {
        id: `trade-sl-${now}`,
        timestamp: now,
        symbol,
        type: 'SELL',
        price: currentPrice,
        amountUsdt: netUsdt,
        amountCoin: next.cryptoBalance,
        feeUsdt: fee,
        pnlUsdt: pnl,
        pnlPct: dropPct,
        reason: `Stop-Loss triggered (-${stopLossPct.toFixed(1)}% protection)`,
      };

      next.usdtBalance += netUsdt;
      next.cryptoBalance = 0;
      next.avgEntryPrice = 0;
      next.dcaTranchesUsed = 0;
      next.realizedPnl += pnl;
      next.totalFeesPaid += fee;
      next.totalTrades += 1;
      next.losingTrades += 1;
      next.history = [executedTrade, ...next.history.slice(0, 49)];
      next.lastActionTime = now;
      next.lastCheckPrice = currentPrice;

      return { nextState: next, newTrade: executedTrade };
    }
  }

  // 2. Check Take-Profit if holding crypto
  if (next.cryptoBalance > 0 && next.avgEntryPrice > 0) {
    const gainPct = ((currentPrice - next.avgEntryPrice) / next.avgEntryPrice) * 100;
    if (gainPct >= takeProfitPct) {
      // Execute TAKE PROFIT sell
      const grossUsdt = next.cryptoBalance * currentPrice;
      const fee = grossUsdt * (feePct / 100);
      const netUsdt = grossUsdt - fee;
      const costBasis = next.cryptoBalance * next.avgEntryPrice;
      const pnl = netUsdt - costBasis;

      executedTrade = {
        id: `trade-tp-${now}`,
        timestamp: now,
        symbol,
        type: 'SELL',
        price: currentPrice,
        amountUsdt: netUsdt,
        amountCoin: next.cryptoBalance,
        feeUsdt: fee,
        pnlUsdt: pnl,
        pnlPct: gainPct,
        reason: `Take-Profit reached (+${gainPct.toFixed(2)}% target hit)`,
      };

      next.usdtBalance += netUsdt;
      next.cryptoBalance = 0;
      next.avgEntryPrice = 0;
      next.dcaTranchesUsed = 0;
      next.realizedPnl += pnl;
      next.totalFeesPaid += fee;
      next.totalTrades += 1;
      next.winningTrades += 1;
      next.history = [executedTrade, ...next.history.slice(0, 49)];
      next.lastActionTime = now;
      next.lastCheckPrice = currentPrice;

      // In Grid bot, regenerate grid orders once profit is taken
      if (strategy === 'GRID') {
        next.openGridOrders = generateGridOrders(currentPrice, settings, next.usdtBalance);
      }

      return { nextState: next, newTrade: executedTrade };
    }
  }

  // 3. Strategy-specific BUY/SELL triggers
  if (strategy === 'GRID') {
    // Check pending grid buy orders
    const buyOrderIndex = next.openGridOrders.findIndex(
      (o) => o.type === 'BUY' && o.status === 'PENDING' && currentPrice <= o.price
    );

    if (buyOrderIndex !== -1 && next.usdtBalance >= orderSizeUsdt) {
      const order = next.openGridOrders[buyOrderIndex];
      const actualBuyUsdt = Math.min(orderSizeUsdt, next.usdtBalance);
      const fee = actualBuyUsdt * (feePct / 100);
      const netBuyUsdt = actualBuyUsdt - fee;
      const coinBought = netBuyUsdt / currentPrice;

      executedTrade = {
        id: `trade-grid-buy-${now}`,
        timestamp: now,
        symbol,
        type: 'BUY',
        price: currentPrice,
        amountUsdt: actualBuyUsdt,
        amountCoin: coinBought,
        feeUsdt: fee,
        reason: `Grid Buy level filled at $${order.price}`,
      };

      // Update average entry price
      const prevTotalCost = next.cryptoBalance * next.avgEntryPrice;
      const newTotalCost = prevTotalCost + actualBuyUsdt;
      const newTotalCrypto = next.cryptoBalance + coinBought;
      next.avgEntryPrice = newTotalCrypto > 0 ? newTotalCost / newTotalCrypto : currentPrice;

      next.usdtBalance -= actualBuyUsdt;
      next.cryptoBalance = newTotalCrypto;
      next.totalFeesPaid += fee;
      next.totalTrades += 1;
      next.history = [executedTrade, ...next.history.slice(0, 49)];

      // Flip the triggered grid order to a corresponding SELL order higher up
      const gridProfitStep = (order.price * (takeProfitPct / 100));
      const sellTargetPrice = order.price + gridProfitStep;

      const updatedGrid = [...next.openGridOrders];
      updatedGrid[buyOrderIndex] = {
        ...order,
        type: 'SELL',
        price: Number(sellTargetPrice.toFixed(4)),
        status: 'PENDING',
        amountCoin: coinBought,
        amountUsdt: coinBought * sellTargetPrice,
      };
      next.openGridOrders = updatedGrid;
      next.lastActionTime = now;
      next.lastCheckPrice = currentPrice;
      return { nextState: next, newTrade: executedTrade };
    }

    // Check pending grid sell orders if holding crypto
    const sellOrderIndex = next.openGridOrders.findIndex(
      (o) => o.type === 'SELL' && o.status === 'PENDING' && currentPrice >= o.price
    );

    if (sellOrderIndex !== -1 && next.cryptoBalance > 0) {
      const order = next.openGridOrders[sellOrderIndex];
      const coinToSell = Math.min(order.amountCoin, next.cryptoBalance);
      if (coinToSell > 0) {
        const grossUsdt = coinToSell * currentPrice;
        const fee = grossUsdt * (feePct / 100);
        const netUsdt = grossUsdt - fee;
        const costBasis = coinToSell * next.avgEntryPrice;
        const pnl = netUsdt - costBasis;

        executedTrade = {
          id: `trade-grid-sell-${now}`,
          timestamp: now,
          symbol,
          type: 'SELL',
          price: currentPrice,
          amountUsdt: netUsdt,
          amountCoin: coinToSell,
          feeUsdt: fee,
          pnlUsdt: pnl,
          pnlPct: next.avgEntryPrice > 0 ? ((currentPrice - next.avgEntryPrice) / next.avgEntryPrice) * 100 : 0,
          reason: `Grid Sell limit filled at $${order.price}`,
        };

        next.usdtBalance += netUsdt;
        next.cryptoBalance -= coinToSell;
        if (next.cryptoBalance <= 0.00001) {
          next.cryptoBalance = 0;
          next.avgEntryPrice = 0;
        }
        next.realizedPnl += pnl;
        next.totalFeesPaid += fee;
        next.totalTrades += 1;
        if (pnl >= 0) next.winningTrades += 1;
        else next.losingTrades += 1;
        next.history = [executedTrade, ...next.history.slice(0, 49)];

        // Flip back to buy order below
        const updatedGrid = [...next.openGridOrders];
        const buyBackPrice = order.price * (1 - (takeProfitPct / 100));
        updatedGrid[sellOrderIndex] = {
          ...order,
          type: 'BUY',
          price: Number(buyBackPrice.toFixed(4)),
          status: 'PENDING',
          amountUsdt: orderSizeUsdt,
          amountCoin: orderSizeUsdt / buyBackPrice,
        };
        next.openGridOrders = updatedGrid;
        next.lastActionTime = now;
        next.lastCheckPrice = currentPrice;
        return { nextState: next, newTrade: executedTrade };
      }
    }
  } else if (strategy === 'DCA') {
    // DCA Logic:
    // If no crypto holdings, buy initial tranche
    if (next.cryptoBalance === 0 && next.usdtBalance >= orderSizeUsdt) {
      const fee = orderSizeUsdt * (feePct / 100);
      const coinBought = (orderSizeUsdt - fee) / currentPrice;

      executedTrade = {
        id: `trade-dca-init-${now}`,
        timestamp: now,
        symbol,
        type: 'BUY',
        price: currentPrice,
        amountUsdt: orderSizeUsdt,
        amountCoin: coinBought,
        feeUsdt: fee,
        reason: 'Initial DCA entry tranche filled',
      };

      next.usdtBalance -= orderSizeUsdt;
      next.cryptoBalance = coinBought;
      next.avgEntryPrice = currentPrice;
      next.dcaTranchesUsed = 1;
      next.totalFeesPaid += fee;
      next.totalTrades += 1;
      next.history = [executedTrade, ...next.history.slice(0, 49)];
      next.lastActionTime = now;
      next.lastCheckPrice = currentPrice;
      return { nextState: next, newTrade: executedTrade };
    }

    // If already holding crypto and price dropped by dipTriggerPct from average entry price
    if (next.cryptoBalance > 0 && next.usdtBalance >= orderSizeUsdt && next.dcaTranchesUsed < 5) {
      const dropFromEntry = ((currentPrice - next.avgEntryPrice) / next.avgEntryPrice) * 100;
      const expectedDip = -(dipTriggerPct * next.dcaTranchesUsed);

      if (dropFromEntry <= expectedDip) {
        const fee = orderSizeUsdt * (feePct / 100);
        const coinBought = (orderSizeUsdt - fee) / currentPrice;

        executedTrade = {
          id: `trade-dca-dip-${now}`,
          timestamp: now,
          symbol,
          type: 'BUY',
          price: currentPrice,
          amountUsdt: orderSizeUsdt,
          amountCoin: coinBought,
          feeUsdt: fee,
          reason: `DCA safety buy #${next.dcaTranchesUsed + 1} on dip (${dropFromEntry.toFixed(2)}%)`,
        };

        const prevCost = next.cryptoBalance * next.avgEntryPrice;
        const newCost = prevCost + orderSizeUsdt;
        const newCrypto = next.cryptoBalance + coinBought;

        next.usdtBalance -= orderSizeUsdt;
        next.cryptoBalance = newCrypto;
        next.avgEntryPrice = newCost / newCrypto;
        next.dcaTranchesUsed += 1;
        next.totalFeesPaid += fee;
        next.totalTrades += 1;
        next.history = [executedTrade, ...next.history.slice(0, 49)];
        next.lastActionTime = now;
        next.lastCheckPrice = currentPrice;
        return { nextState: next, newTrade: executedTrade };
      }
    }
  } else if (strategy === 'RSI_REVERSAL') {
    // Calculate RSI from candle closes
    const closePrices = klines.map((k) => k.close);
    const rsi = calculateRsi(closePrices);

    // Oversold buy condition (< 32)
    if (rsi < 32 && next.cryptoBalance === 0 && next.usdtBalance >= orderSizeUsdt) {
      const buyAmount = Math.min(orderSizeUsdt, next.usdtBalance);
      const fee = buyAmount * (feePct / 100);
      const coinBought = (buyAmount - fee) / currentPrice;

      executedTrade = {
        id: `trade-rsi-buy-${now}`,
        timestamp: now,
        symbol,
        type: 'BUY',
        price: currentPrice,
        amountUsdt: buyAmount,
        amountCoin: coinBought,
        feeUsdt: fee,
        reason: `RSI Oversold condition met (${rsi.toFixed(1)} < 32)`,
      };

      next.usdtBalance -= buyAmount;
      next.cryptoBalance = coinBought;
      next.avgEntryPrice = currentPrice;
      next.totalFeesPaid += fee;
      next.totalTrades += 1;
      next.history = [executedTrade, ...next.history.slice(0, 49)];
      next.lastActionTime = now;
      next.lastCheckPrice = currentPrice;
      return { nextState: next, newTrade: executedTrade };
    }

    // Overbought sell condition (> 65)
    if (rsi > 65 && next.cryptoBalance > 0) {
      const grossUsdt = next.cryptoBalance * currentPrice;
      const fee = grossUsdt * (feePct / 100);
      const netUsdt = grossUsdt - fee;
      const costBasis = next.cryptoBalance * next.avgEntryPrice;
      const pnl = netUsdt - costBasis;

      executedTrade = {
        id: `trade-rsi-sell-${now}`,
        timestamp: now,
        symbol,
        type: 'SELL',
        price: currentPrice,
        amountUsdt: netUsdt,
        amountCoin: next.cryptoBalance,
        feeUsdt: fee,
        pnlUsdt: pnl,
        pnlPct: next.avgEntryPrice > 0 ? ((currentPrice - next.avgEntryPrice) / next.avgEntryPrice) * 100 : 0,
        reason: `RSI Overbought condition met (${rsi.toFixed(1)} > 65)`,
      };

      next.usdtBalance += netUsdt;
      next.cryptoBalance = 0;
      next.avgEntryPrice = 0;
      next.realizedPnl += pnl;
      next.totalFeesPaid += fee;
      next.totalTrades += 1;
      if (pnl >= 0) next.winningTrades += 1;
      else next.losingTrades += 1;
      next.history = [executedTrade, ...next.history.slice(0, 49)];
      next.lastActionTime = now;
      next.lastCheckPrice = currentPrice;
      return { nextState: next, newTrade: executedTrade };
    }
  } else if (strategy === 'SCALP_PRO') {
    const lev = Math.max(1, settings.leverage || 1);
    const closePrices = klines.map((k) => k.close);
    const emaFast = calculateEma(closePrices, settings.scalpEmaFast || 9);
    const emaSlow = calculateEma(closePrices, settings.scalpEmaSlow || 21);
    const isBullishCross = emaFast > emaSlow;

    // 1. Check for Leverage Liquidation if holding position
    if (next.cryptoBalance > 0 && next.avgEntryPrice > 0 && lev > 1) {
      const priceDropPct = ((currentPrice - next.avgEntryPrice) / next.avgEntryPrice) * 100;
      const liquidationDrop = -(90 / lev); // e.g. -4.5% at 20x, -9% at 10x

      if (priceDropPct <= liquidationDrop) {
        // LIQUIDATION EVENT
        const positionNotional = next.cryptoBalance * currentPrice;
        const fee = positionNotional * (feePct / 100);
        const lostMargin = next.cryptoBalance * next.avgEntryPrice / lev;

        executedTrade = {
          id: `trade-liq-${now}`,
          timestamp: now,
          symbol,
          type: 'SELL',
          price: currentPrice,
          amountUsdt: 0,
          amountCoin: next.cryptoBalance,
          feeUsdt: fee,
          pnlUsdt: -lostMargin,
          pnlPct: -100,
          reason: `💥 LIQUIDATION at ${lev}x Leverage! -${Math.abs(priceDropPct).toFixed(1)}% move wiped margin.`,
        };

        next.cryptoBalance = 0;
        next.avgEntryPrice = 0;
        next.realizedPnl -= lostMargin;
        next.totalFeesPaid += fee;
        next.totalTrades += 1;
        next.losingTrades += 1;
        next.history = [executedTrade, ...next.history.slice(0, 49)];
        next.lastActionTime = now;
        next.lastCheckPrice = currentPrice;
        return { nextState: next, newTrade: executedTrade };
      }
    }

    // 2. Scalp Entry: Fast EMA > Slow EMA and not currently holding
    if (isBullishCross && next.cryptoBalance === 0 && next.usdtBalance >= orderSizeUsdt) {
      const marginAllocated = Math.min(orderSizeUsdt, next.usdtBalance);
      const notionalSize = marginAllocated * lev;
      const fee = notionalSize * (feePct / 100);
      const coinBought = (notionalSize - fee) / currentPrice;

      executedTrade = {
        id: `trade-scalp-buy-${now}`,
        timestamp: now,
        symbol,
        type: 'BUY',
        price: currentPrice,
        amountUsdt: marginAllocated,
        amountCoin: coinBought,
        feeUsdt: fee,
        reason: `⚡ Scalp Long entry: EMA ${settings.scalpEmaFast || 9} crossed above EMA ${settings.scalpEmaSlow || 21} (${lev}x lev)`,
      };

      next.usdtBalance -= marginAllocated;
      next.cryptoBalance = coinBought;
      next.avgEntryPrice = currentPrice;
      next.totalFeesPaid += fee;
      next.totalTrades += 1;
      next.history = [executedTrade, ...next.history.slice(0, 49)];
      next.lastActionTime = now;
      next.lastCheckPrice = currentPrice;
      return { nextState: next, newTrade: executedTrade };
    }

    // 3. Scalp Exit: Take Profit or Stop Loss
    if (next.cryptoBalance > 0 && next.avgEntryPrice > 0) {
      const rawPriceChangePct = ((currentPrice - next.avgEntryPrice) / next.avgEntryPrice) * 100;
      const leveragedGainPct = rawPriceChangePct * lev;

      // Check Scalp Take-Profit Target (e.g. 1.2% price move * lev)
      const hitTakeProfit = leveragedGainPct >= takeProfitPct;
      // Check Scalp Stop-Loss Protection (e.g. -0.8% price move * lev)
      const hitStopLoss = leveragedGainPct <= -stopLossPct;

      if (hitTakeProfit || hitStopLoss) {
        const notionalGross = next.cryptoBalance * currentPrice;
        const fee = notionalGross * (feePct / 100);
        const marginCost = (next.cryptoBalance * next.avgEntryPrice) / lev;
        const rawProfit = (currentPrice - next.avgEntryPrice) * next.cryptoBalance;
        const netMarginReturned = Math.max(0, marginCost + rawProfit - fee);
        const netPnl = netMarginReturned - marginCost;

        executedTrade = {
          id: `trade-scalp-exit-${now}`,
          timestamp: now,
          symbol,
          type: 'SELL',
          price: currentPrice,
          amountUsdt: netMarginReturned,
          amountCoin: next.cryptoBalance,
          feeUsdt: fee,
          pnlUsdt: netPnl,
          pnlPct: leveragedGainPct,
          reason: hitTakeProfit
            ? `🎯 Scalp TP hit: +${leveragedGainPct.toFixed(1)}% net gain (${lev}x lev)`
            : `🛑 Scalp SL hit: ${leveragedGainPct.toFixed(1)}% protection (${lev}x lev)`,
        };

        next.usdtBalance += netMarginReturned;
        next.cryptoBalance = 0;
        next.avgEntryPrice = 0;
        next.realizedPnl += netPnl;
        next.totalFeesPaid += fee;
        next.totalTrades += 1;
        if (netPnl >= 0) next.winningTrades += 1;
        else next.losingTrades += 1;
        next.history = [executedTrade, ...next.history.slice(0, 49)];
        next.lastActionTime = now;
        next.lastCheckPrice = currentPrice;
        return { nextState: next, newTrade: executedTrade };
      }
    }
  }

  next.lastCheckPrice = currentPrice;
  return { nextState: next, newTrade: null };
}
