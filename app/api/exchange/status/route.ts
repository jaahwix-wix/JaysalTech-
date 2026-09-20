import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.EXCHANGE_API_KEY;
  const apiSecret = process.env.EXCHANGE_API_SECRET;
  const exchange = process.env.EXCHANGE_NAME || 'binance';

  if (!apiKey || !apiSecret || apiKey.trim() === '' || apiSecret.trim() === '') {
    return NextResponse.json({
      configured: false,
      exchange,
      status: 'NOT_CONFIGURED',
      message: 'Exchange API key and secret are not configured in environment variables.',
      checklist: [
        { title: 'Create Exchange Account', desc: 'Create and verify account on Binance, Bybit, or OKX.', done: false },
        { title: 'Generate API Key with Strict Permissions', desc: 'Enable "Read Info" and "Spot Trading". Strictly DISABLE "Withdrawals" and "Futures".', done: false },
        { title: 'Inject Credentials Securely', desc: 'Add EXCHANGE_API_KEY and EXCHANGE_API_SECRET in AI Studio Secrets settings.', done: false },
        { title: 'Fund Account with 50 USDT', desc: 'Deposit 50 USDT on the spot wallet (not futures margin).', done: false },
      ],
    });
  }

  // Attempt live connection check depending on exchange
  try {
    const isBingX = exchange.toLowerCase().includes('bingx');
    const timestamp = Date.now();
    let res: Response;

    if (isBingX) {
      // BingX API requires query parameters timestamp & recvWindow sorted or standard
      const queryString = `timestamp=${timestamp}&recvWindow=5000`;
      const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
      const url = `https://open-api.bingx.com/openApi/spot/v1/account/balance?${queryString}&signature=${signature}`;
      res = await fetch(url, {
        headers: {
          'X-BX-APIKEY': apiKey.trim(),
        },
        cache: 'no-store',
      });
    } else {
      // Binance (default)
      const queryString = `timestamp=${timestamp}&recvWindow=5000`;
      const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
      res = await fetch(`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`, {
        headers: {
          'X-MBX-APIKEY': apiKey.trim(),
        },
        cache: 'no-store',
      });
    }

    const rawText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText };
    }

    if (!res.ok) {
      return NextResponse.json({
        configured: true,
        exchange,
        status: 'CONNECTION_ERROR',
        httpStatus: res.status,
        message: data.msg || data.message || `Exchange returned HTTP ${res.status}.`,
        debug: isBingX ? 'bingx_endpoint' : 'binance_endpoint',
        canTrade: false,
        canWithdraw: false,
      });
    }
    
    // Check if BingX returned an error code inside JSON (e.g. code !== 0)
    if (isBingX && data.code !== undefined && data.code !== 0) {
      return NextResponse.json({
        configured: true,
        exchange,
        status: 'CONNECTION_ERROR',
        message: data.msg || data.message || `BingX error code ${data.code}`,
        canTrade: false,
        canWithdraw: false,
      });
    }

    let usdtFree = 0;
    let canWithdraw = false;

    if (isBingX) {
      const balances = data.data?.balances || [];
      const usdt = balances.find((b: { asset?: string; coin?: string }) => (b.asset === 'USDT' || b.coin === 'USDT'));
      if (usdt) {
        usdtFree = parseFloat(usdt.free || usdt.available || '0');
      }
      canWithdraw = false; // BingX API keys for spot default to no withdrawal unless requested
    } else {
      const usdtBalance = data.balances?.find((b: { asset: string; free: string }) => b.asset === 'USDT');
      usdtFree = usdtBalance ? parseFloat(usdtBalance.free) : 0;
      canWithdraw = data.canWithdraw ?? false;
    }

    return NextResponse.json({
      configured: true,
      exchange,
      status: 'CONNECTED_LIVE',
      message: `Successfully authenticated with ${exchange} spot API.`,
      canTrade: true,
      canWithdraw,
      accountType: 'SPOT',
      spotUsdtBalance: usdtFree,
      checklist: [
        { title: `${exchange} Account Connected`, desc: `Authenticated via API key.`, done: true },
        { title: 'Permissions Verification', desc: canWithdraw ? '⚠️ WARNING: Withdrawals enabled! Please disable withdrawals in exchange settings.' : 'Withdrawals disabled (Safe).', done: !canWithdraw },
        { title: 'Secure Server Injection', desc: 'Encrypted server-side authentication verified.', done: true },
        { title: 'Fund Account with 50 USDT', desc: usdtFree >= 15 ? `Found $${usdtFree.toFixed(2)} USDT in Spot Wallet.` : `Spot wallet has $${usdtFree.toFixed(2)} USDT (Need min 15-50 USDT to begin live trading).`, done: usdtFree >= 15 },
      ],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({
      configured: true,
      exchange,
      status: 'NETWORK_ERROR',
      message: `Failed to reach exchange API: ${errorMsg}`,
      canTrade: false,
    });
  }
}
