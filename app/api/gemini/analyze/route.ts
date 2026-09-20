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
      startingCapital = 7.4,
      orderSize,
      takeProfitPct,
      stopLossPct,
      gridCount,
      userQuestion,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Structured prompt tailored for $7.40 micro-capital crypto trading
    const prompt = `
You are a senior quantitative crypto risk manager and algorithmic trading engineer.
The user has a starting capital of ${startingCapital} USDT and wants to make a profit safely using an automated crypto bot without losing their funds.

Trading Setup details:
- Strategy: ${strategy || 'Grid Trading / DCA / Scalp'}
- Asset: ${symbol || 'SOL/USDT'} (Current Price: $${currentPrice || 'N/A'})
- Order Allocation: $${orderSize || '2.0'} USDT per order
- Take Profit Target: ${takeProfitPct || '2.5'}%
- Stop Loss: ${stopLossPct || '2.0'}%
- Grid levels: ${gridCount || '4'}
${userQuestion ? `- User Specific Question: "${userQuestion}"` : ''}

CRITICAL RULES FOR $7.40 MICRO-CAPITAL:
1. Emphasize that $7.40 is micro-capital where trading fees (0.1% maker/taker), exchange minimum order limits (BingX permits $1-$2 orders; Binance requires $5 min), and slippage are primary factors.
2. Strongly warn against futures leverage (e.g. 10x-50x), explaining how easily a small wick liquidates $7.40.
3. Warn against common scams (e.g. Telegram "guaranteed return" bots, sending funds to unknown contracts, or giving API keys with "Withdrawal" enabled).
4. Provide realistic, mathematical compounding projections (e.g., 0.5% - 2% weekly realistic targets) instead of unrealistic promises.
5. Give 3 actionable, specific configuration adjustments to improve this exact setup.

Please format your response strictly as JSON with the following structure:
{
  "riskScore": number (1 to 10, where 1 is safest spot DCA and 10 is reckless leverage),
  "verdict": string (short punchy summary e.g. "Viable with Fee Caution" or "High Risk of Squeeze"),
  "realisticMonthlyReturn": string (e.g. "+3% to +6% (~$0.25 - $0.50 net)"),
  "feeImpactExplanation": string (how much fees will eat on ${startingCapital} USDT with this trade frequency),
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
          riskScore: strategy === 'Grid' ? 4 : strategy === 'DCA' ? 3 : 5,
          verdict: 'Viable Micro-Spot Strategy (Zero-Liquidation)',
          realisticMonthlyReturn: '+2.5% to +5.0% (~$0.20 - $0.40 net)',
          feeImpactExplanation:
            `At standard 0.1% spot fees per side, each round-trip trade costs ~$0.004 on a $2.00 order. With $${startingCapital} capital, staggering 3-4 micro-tranches preserves liquidity without incurring heavy percentage drag.`,
          keyStrengths: [
            'Spot trading prevents liquidation risk completely',
            `Dividing $${startingCapital} into ${Math.floor(startingCapital / (orderSize || 2))} micro-tranches allows absorbing small dips`,
            'High liquidity pair minimizes slippage'
          ],
          criticalRisks: [
            'Exchange minimum order constraint ($1-$2 on BingX; $5 on Binance)',
            'Prolonged downtrends can leave funds temporarily tied up',
            'Over-trading can accumulate maker/taker fee friction'
          ],
          recommendedAdjustments: [
            'Use Limit Orders to minimize taker fees and capture best bid/ask spreads',
            'Set grid spacing to at least 1.0% to ensure profit exceeds round-trip fee friction',
            'Never enable Futures high leverage or API withdrawal permissions'
          ],
          safetyChecklist: [
            'Exchange API Key permissions: Enable ONLY "Reading" and "Spot Trading"',
            'Exchange API Key permissions: STRICTLY DISABLE "Withdrawals" and "Transfers"',
            'Bind API Key to specific static IP address if running on a VPS',
            'Always test logic with Paper Trading before risking live USDT'
          ],
          botAdviceSummary:
            `With $${startingCapital} capital, consistency and survival matter more than rapid doubling. A spot arithmetic micro-grid or automated DCA bot on major liquid assets (SOL, BTC, ETH) with 1-2% spacing is the safest algorithmic route to steadily compound small capital without liquidation risk.`
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
          realisticMonthlyReturn: '+2.5% to +5.0% (~$0.20 - $0.40 net)',
          feeImpactExplanation: 'Standard 0.1% spot fee consumes ~$0.004 per $2.00 order round-trip.',
          keyStrengths: ['Zero margin liquidation risk', 'Disciplined take-profit rule'],
          criticalRisks: ['Small capital limits grid density'],
          recommendedAdjustments: ['Keep grid spacing above 1.2%'],
          safetyChecklist: ['Never allow API withdrawal permission'],
          botAdviceSummary: 'Spot DCA or conservative Arithmetic Grid is the recommended approach for $7.40 capital on BingX.',
        },
      },
      { status: 200 }
    );
  }
}
