const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function evaluateSignal(signal) {
  const prompt = `You are an ICT trading assistant evaluating a Fair Value Gap (FVG) setup on MES.

Signal:
- Direction: ${signal.direction}
- FVG Top: ${signal.fvgTop}
- FVG Bottom: ${signal.fvgBottom}
- CE: ${signal.ce}
- Stop Loss: ${signal.stopLoss}
- Take Profit: ${signal.takeProfit}

Check: Is risk/reward at least 1:2? Is CE between FVG top and bottom?

Respond in this exact JSON only, no other text:
{"decision":"TRADE","reasoning":"one sentence","riskReward":"1:2"}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim().replace(/```json|```/g, "");
  return JSON.parse(text);
}

module.exports = { evaluateSignal };
