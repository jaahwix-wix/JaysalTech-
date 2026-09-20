import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      strategy,
      symbol,
      currentPrice,
      startingCapital = 50,
      orderSize,
      takeProfitPct,
      stopLossPct,
      gridCount,
      userQuestion,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Structured prompt tailored for 50 USDT micro-capital crypto trading
    const prompt = `
You are a senior quantitative crypto risk manager and algorithmic trading engineer.
The user has a starting capital of ${startingCapital} USDT and wants to make a profit safely using an automated crypto bot without losing their funds.

Trading Setup details:
- Strategy: ${strategy || 'Grid Trading / DCA'}
- Asset: ${symbol || 'SOL/USDT'} (Current Price: $${currentPrice || 'N/A'})
- Order Allocation: $${orderSize || '10'} USDT per order
- Take Profit Target: ${takeProfitPct || '2.5'}%
- Stop Loss: ${stopLossPct || '2.0'}%
- Grid levels: ${gridCount || '5'}
${userQuestion ? `- User Specific Question: "${userQuestion}"` : ''}

CRITICAL RULES FOR 50 USDT CAPITAL:
1. Emphasize that 50 USDT is micro-capital where trading fees (0.1% maker/taker), exchange minimum order limits (Binance/Bybit require $5-$10 minimum order size), and slippage are the #1 profit killers.
2. Strongly warn against futures leverage (e.g. 10x-50x), explaining how easily a small wick liquidates $50.
3. Warn against common scams (e.g. Telegram "guaranteed return" bots, sending 50 USDT to an unknown smart contract, or giving API keys with "Withdrawal" enabled).
4. Provide realistic, mathematical compounding projections (e.g., 0.5% - 2% weekly realistic targets) instead of unrealistic promises.
5. Give 3 actionable, specific configuration adjustments to improve this exact setup.

Please format your response strictly as JSON with the following structure:
{
  "riskScore": number (1 to 10, where 1 is safest spot DCA and 10 is reckless leverage),
  "verdict": string (short punchy summary e.g. "Viable with Fee Caution" or "High Risk of Squeeze"),
  "realisticMonthlyReturn": string (e.g. "+3% to +6% (~$1.50 - $3.00 net)"),
  "feeImpactExplanation": string (how much fees will eat on 50 USDT with this trade frequency),
  "keyStrengths": string[],
  "criticalRisks": string[],
  "recommendedAdjustments": string[],
  "safetyChecklist": string[],
  "botAdviceSummary": string
}
Return ONLY valid JSON.
`;

    if (!apiKey) {
      // Fallback deterministic analysis if API key is not yet configured
      return NextResponse.json({
        success: true,
        data: {
          riskScore: strategy === 'Grid' ? 4 : strategy === 'DCA' ? 3 : 6,
          verdict: 'Viable Micro-Spot Strategy (Low Fee Headroom)',
          realisticMonthlyReturn: '+2.5% to +5.0% (~$1.25 - $2.50 net)',
          feeImpactExplanation:
            'At standard 0.1% spot fees per side, each round-trip trade costs $0.02 on a $10 order. Your take-profit target must exceed 0.25% just to break even after exchange fees and spread.',
          keyStrengths: [
            'Spot trading prevents liquidation risk',
            `Dividing $50 into ${Math.floor(startingCapital / (orderSize || 10))} tranches allows absorbing pullbacks`,
            'High liquidity pair minimizes slippage'
          ],
          criticalRisks: [
            'Exchange minimum order constraint ($5-$10 min on Binance/Bybit limits sub-division)',
            'Prolonged downtrends can leave funds stuck in depreciating assets',
            'Over-trading can consume profits through maker/taker fees'
          ],
          recommendedAdjustments: [
            'Use Limit Orders exclusively to qualify for maker fee discounts (0.075% with BNB/VIP0)',
            'Set grid spacing to at least 1.0% to ensure profit exceeds round-trip fee friction',
            'Never enable Futures/Margin or API withdrawal permissions'
          ],
          safetyChecklist: [
            'Exchange API Key permissions: Enable ONLY "Reading" and "Spot Trading"',
            'Exchange API Key permissions: STRICTLY DISABLE "Withdrawals" and "Transfers"',
            'Bind API Key to specific static IP address if running on a VPS',
            'Always test logic with Paper Trading before risking live USDT'
          ],
          botAdviceSummary:
            'With 50 USDT, consistency and survival matter more than rapid doubling. A spot arithmetic grid or automated DCA bot on major liquid assets (SOL, BTC, ETH) with 1-2% spacing is the safest algorithmic route to steadily compound small capital without liquidation risk.'
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = {
        riskScore: 4,
        verdict: 'Viable Strategy with Caution',
        realisticMonthlyReturn: '+3% to +6%',
        feeImpactExplanation: 'Exchange fees (0.1% maker/taker) represent ~0.2% round-trip friction.',
        keyStrengths: ['Spot execution prevents liquidation'],
        criticalRisks: ['Exchange minimum order limits of $5-$10'],
        recommendedAdjustments: ['Use Limit orders only to minimize slippage'],
        safetyChecklist: ['Disable API withdrawals permanently'],
        botAdviceSummary: rawText,
      };
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: unknown) {
    console.error('Gemini analyze API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        fallbackData: {
          riskScore: 4,
          verdict: 'Solid Spot Framework (Fee Caution)',
          realisticMonthlyReturn: '+2.5% to +5.0% (~$1.25 - $2.50 net)',
          feeImpactExplanation: 'Standard 0.1% spot fee consumes $0.02 per $10 order round-trip.',
          keyStrengths: ['Zero margin liquidation risk', 'Disciplined take-profit rule'],
          criticalRisks: ['Small capital limits grid density'],
          recommendedAdjustments: ['Keep grid spacing above 1.2%'],
          safetyChecklist: ['Never allow API withdrawal permission'],
          botAdviceSummary: 'Spot DCA or conservative Arithmetic Grid is the recommended approach for 50 USDT capital.',
        },
      },
      { status: 200 }
    );
  }
}
