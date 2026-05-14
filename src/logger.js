const trades = [];
let tradeId = 1;

function logTrade({ signal, decision }) {
  const trade = {
    id: tradeId++,
    timestamp: new Date().toISOString(),
    symbol: signal.symbol || "MESU5",
    direction: signal.direction,
    fvgTop: signal.fvgTop,
    fvgBottom: signal.fvgBottom,
    ce: signal.ce,
    entryPrice: signal.ce,
    stopLoss: signal.stopLoss,
    takeProfit: signal.takeProfit,
    contracts: 1,
    claudeDecision: decision.decision,
    claudeReasoning: decision.reasoning,
    status: "OPEN",
    pnl: null,
  };
  trades.push(trade);
  return trade;
}

function closeTrade(id, exitPrice, reason) {
  const trade = trades.find((t) => t.id === id);
  if (!trade) return null;
  const tickSize = 0.25;
  const tickValue = 1.25;
  const ticks = trade.direction === "bullish"
    ? (exitPrice - trade.entryPrice) / tickSize
    : (trade.entryPrice - exitPrice) / tickSize;
  trade.exitPrice = exitPrice;
  trade.exitReason = reason;
  trade.pnl = ticks * tickValue * trade.contracts;
  trade.status = "CLOSED";
  trade.closedAt = new Date().toISOString();
  return trade;
}

function getTrades() { return trades; }

function getStats() {
  const closed = trades.filter((t) => t.status === "CLOSED");
  const open = trades.filter((t) => t.status === "OPEN");
  const skipped = trades.filter((t) => t.claudeDecision === "SKIP");
  const winners = closed.filter((t) => t.pnl > 0);
  const losers = closed.filter((t) => t.pnl <= 0);
  const totalPnl = closed.reduce((sum, t) => sum + (t.pnl || 0), 0);
  return {
    totalSignals: trades.length,
    openTrades: open.length,
    closedTrades: closed.length,
    skippedByClaude: skipped.length,
    winners: winners.length,
    losers: losers.length,
    winRate: closed.length > 0 ? ((winners.length / closed.length) * 100).toFixed(1) + "%" : "N/A",
    totalPnl: "$" + totalPnl.toFixed(2),
  };
}

module.exports = { logTrade, closeTrade, getTrades, getStats };
