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

  // Attempt live connection check to Binance if credentials are provided
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}&recvWindow=5000`;
    const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');

    const res = await fetch(`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`, {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json({
        configured: true,
        exchange,
        status: 'CONNECTION_ERROR',
        message: errData.msg || `Exchange returned HTTP ${res.status}. Check key permissions and IP restrictions.`,
        canTrade: false,
        canWithdraw: false,
      });
    }

    const accountData = await res.json();
    const usdtBalance = accountData.balances?.find((b: { asset: string; free: string }) => b.asset === 'USDT');

    return NextResponse.json({
      configured: true,
      exchange,
      status: 'CONNECTED_LIVE',
      message: 'Successfully authenticated with exchange spot API.',
      canTrade: accountData.canTrade ?? true,
      canWithdraw: accountData.canWithdraw ?? false,
      accountType: accountData.accountType || 'SPOT',
      spotUsdtBalance: usdtBalance ? parseFloat(usdtBalance.free) : 0,
      checklist: [
        { title: 'Create Exchange Account', desc: 'Account connected.', done: true },
        { title: 'Generate API Key with Strict Permissions', desc: accountData.canWithdraw ? '⚠️ WARNING: Withdrawals are enabled! Please disable withdrawals immediately.' : 'Withdrawals disabled (Safe).', done: !accountData.canWithdraw },
        { title: 'Inject Credentials Securely', desc: 'API Key authenticated.', done: true },
        { title: 'Fund Account with 50 USDT', desc: usdtBalance && parseFloat(usdtBalance.free) >= 15 ? `Funded: $${parseFloat(usdtBalance.free).toFixed(2)} USDT` : 'Balance below 15 USDT minimum.', done: !!(usdtBalance && parseFloat(usdtBalance.free) >= 15) },
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
