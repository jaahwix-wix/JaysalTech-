import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'SOLUSDT';
  const interval = searchParams.get('interval') || '5m';

  try {
    // 1. Fetch 24hr tickers for top pairs only (tiny payload)
    const symbolsParam = JSON.stringify(SYMBOLS);
    const tickerRes = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`,
      { cache: 'no-store', headers: { 'User-Agent': 'CryptoBotSimulator/1.0' } }
    );

    if (!tickerRes.ok) {
      throw new Error(`Binance API returned status: ${tickerRes.status}`);
    }

    const rawTickers = await tickerRes.json();
    if (!Array.isArray(rawTickers)) {
      throw new Error(`Binance returned non-array payload: ${JSON.stringify(rawTickers)}`);
    }

    const filteredTickers = rawTickers;

    // 2. Fetch klines (recent 5m candles by default) for the selected symbol
    const activeSymbol = SYMBOLS.includes(symbol) ? symbol : 'SOLUSDT';
    const validIntervals = ['1m', '5m', '15m', '1h', '4h', '1d'];
    const activeInterval = validIntervals.includes(interval) ? interval : '5m';

    const klinesRes = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${activeSymbol}&interval=${activeInterval}&limit=36`,
      { cache: 'no-store' }
    );

    let klinesData: Array<{
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }> = [];

    if (klinesRes.ok) {
      const rawKlines = await klinesRes.json();
      klinesData = rawKlines.map((k: (string | number)[]) => ({
        time: Number(k[0]),
        open: parseFloat(String(k[1])),
        high: parseFloat(String(k[2])),
        low: parseFloat(String(k[3])),
        close: parseFloat(String(k[4])),
        volume: parseFloat(String(k[5])),
      }));
    }

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      tickers: filteredTickers.map((t: {
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
        highPrice: string;
        lowPrice: string;
        volume: string;
      }) => ({
        symbol: t.symbol,
        price: parseFloat(t.lastPrice),
        change24h: parseFloat(t.priceChangePercent),
        high24h: parseFloat(t.highPrice),
        low24h: parseFloat(t.lowPrice),
        volume: parseFloat(t.volume),
      })),
      klines: klinesData,
    });
  } catch (error) {
    console.error('Market API error, using reliable fallback:', error);
    // Reliable fallback pricing in case of external rate limits
    const fallbackPrices: Record<string, { price: number; change24h: number; high24h: number; low24h: number }> = {
      BTCUSDT: { price: 89450, change24h: 1.85, high24h: 91200, low24h: 88100 },
      ETHUSDT: { price: 3120, change24h: -0.65, high24h: 3240, low24h: 3080 },
      SOLUSDT: { price: 185.5, change24h: 3.42, high24h: 192.0, low24h: 178.5 },
      BNBUSDT: { price: 620, change24h: 0.95, high24h: 635, low24h: 612 },
      XRPUSDT: { price: 2.15, change24h: 4.10, high24h: 2.30, low24h: 2.05 },
      DOGEUSDT: { price: 0.245, change24h: -1.2, high24h: 0.26, low24h: 0.238 },
    };

    const target = fallbackPrices[symbol] || fallbackPrices['SOLUSDT'];
    const now = Date.now();
    const intervalMinutes = interval === '1m' ? 1 : interval === '15m' ? 15 : interval === '1h' ? 60 : 5;
    const fallbackKlines = Array.from({ length: 36 }).map((_, i) => {
      const factor = 1 + (Math.sin(i / 3) * 0.015) + ((i - 18) * 0.001);
      const base = target.price * factor;
      return {
        time: now - (36 - i) * intervalMinutes * 60 * 1000,
        open: base * 0.998,
        high: base * 1.006,
        low: base * 0.994,
        close: base,
        volume: 125000 + i * 5000,
      };
    });

    return NextResponse.json({
      success: true,
      fallback: true,
      timestamp: Date.now(),
      tickers: Object.entries(fallbackPrices).map(([sym, data]) => ({
        symbol: sym,
        price: data.price,
        change24h: data.change24h,
        high24h: data.high24h,
        low24h: data.low24h,
        volume: 4500000,
      })),
      klines: fallbackKlines,
    });
  }
}
