require("dotenv").config();
const express = require("express");
const { evaluateSignal } = require("./claude");
const { logTrade, closeTrade, getTrades, getStats } = require("./logger");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "fvg2024";

app.use(express.json());

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

app.get("/", (req, res) => {
  const stats = getStats();
  const trades = getTrades().slice().reverse().slice(0, 20);

  const rows = trades.map((t) => `
    <tr style="border-bottom:1px solid #333">
      <td>${t.id}</td>
      <td>${new Date(t.timestamp).toLocaleString()}</td>
      <td>${t.symbol}</td>
      <td style="color:${t.direction === 'bullish' ? '#00ff88' : '#ff4444'}">${t.direction.toUpperCase()}</td>
      <td>${t.entryPrice || '-'}</td>
      <td>${t.stopLoss}</td>
      <td>${t.takeProfit}</td>
      <td style="color:${t.claudeDecision === 'TRADE' ? '#00ff88' : '#ffaa00'}">${t.claudeDecision}</td>
      <td>${t.status}</td>
      <td style="color:${t.pnl > 0 ? '#00ff88' : t.pnl < 0 ? '#ff4444' : '#888'}">${t.pnl != null ? '$' + t.pnl.toFixed(2) : '-'}</td>
    </tr>
  `).join('');

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>FVG Paper Trading Bot</title>
  <meta http-equiv="refresh" content="10">
  <style>
    body { background: #0d0d0d; color: #eee; font-family: monospace; padding: 20px; }
    h1 { color: #00ff88; }
    .stats { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; }
    .stat { background: #1a1a1a; padding: 15px 20px; border-radius: 8px; min-width: 120px; }
    .stat-label { color: #888; font-size: 12px; }
    .stat-value { color: #00ff88; font-size: 22px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #1a1a1a; padding: 10px; text-align: left; color: #888; font-size: 12px; }
    td { padding: 8px 10px; font-size: 13px; }
  </style>
</head>
<body>
  <h1>📈 FVG Paper Trading Bot</h1>
  <p style="color:#888;font-size:12px">Auto-refreshes every 10s · ${new Date().toLocaleString()}</p>
  <div class="stats">
    <div class="stat"><div class="stat-label">Total Signals</div><div class="stat-value">${stats.totalSignals}</div></div>
    <div class="stat"><div class="stat-label">Open Trades</div><div class="stat-value">${stats.openTrades}</div></div>
    <div class="stat"><div class="stat-label">Closed Trades</div><div class="stat-value">${stats.closedTrades}</div></div>
    <div class="stat"><div class="stat-label">Win Rate</div><div class="stat-value">${stats.winRate}</div></div>
    <div class="stat"><div class="stat-label">Total P&L</div><div class="stat-value" style="color:${parseFloat(stats.totalPnl) >= 0 ? '#00ff88' : '#ff4444'}">${stats.totalPnl}</div></div>
    <div class="stat"><div class="stat-label">Skipped by Claude</div><div class="stat-value" style="color:#ffaa00">${stats.skippedByClaude}</div></div>
  </div>
  <table>
    <tr><th>#</th><th>Time</th><th>Symbol</th><th>Dir</th><th>Entry</th><th>Stop</th><th>Target</th><th>Claude</th><th>Status</th><th>P&L</th></tr>
    ${rows || '<tr><td colspan="10" style="color:#888;padding:20px">No signals yet. Waiting for TradingView alerts...</td></tr>'}
  </table>
</body>
</html>`);
});

app.post("/webhook", async (req, res) => {
  const signal = req.body;
  if (signal.secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  log(`📡 Signal: ${signal.direction} CE:${signal.ce}`);
  try {
    const decision = await evaluateSignal(signal);
    const trade = logTrade({ signal, decision });
    log(`🤖 Claude: ${decision.decision} — ${decision.reasoning}`);
    return res.json({ status: decision.decision, trade, decision });
  } catch (err) {
    log(`💥 Error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/close/:id", (req, res) => {
  const { exitPrice, reason } = req.body;
  const trade = closeTrade(parseInt(req.params.id), exitPrice, reason || "manual");
  if (!trade) return res.status(404).json({ error: "Trade not found" });
  return res.json({ trade });
});

app.get("/stats", (req, res) => res.json(getStats()));

app.listen(PORT, () => {
  log(`🚀 FVG Paper Bot running on port ${PORT}`);
});
