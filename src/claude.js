const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a disciplined ICT futures trading assistant. You evaluate trade signals based strictly on the FVG strategy rules. You NEVER deviate from these rules.

BULLISH SETUP: 1) SSL swept 2) Bullish FVG forms 3) Bearish candle closes inside FVG body ABOVE CE 4) Signal candle closes ABOVE FVG top = ENTRY
BEARISH SETUP: 1) BSL swept 2) Bearish FVG forms 3) Bullish candle closes inside FVG body BELOW CE 4) Signal candle closes BELOW FVG bottom = ENTRY
SKIP IF: No liquidity sweep, CE broken, daily bias mismatch, major news within 30 min.

Respond ONLY with valid JSON:
{"decision":"TRADE"|"SKIP","action":"Buy"|"Sell"|null,"contracts":number|null,"reasoning":"brief","confidence":"A+"|"A"|"B"|"SKIP","warnings":[]}`;

async function evaluateSignal(signalData, accountBalance) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Evaluate this FVG signal: ${JSON.stringify(signalData)} Account balance: $${accountBalance.cashBalance}. Respond with JSON only.` }],
  });

  try {
    return JSON.parse(response.content[0].text.trim());
  } catch {
    return { decision: "SKIP", reasoning: "Parse error", confidence: "SKIP" };
  }
}

module.exports = { evaluateSignal };