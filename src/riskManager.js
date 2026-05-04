class RiskManager {
  constructor() {
    this.dailyLossLimit = parseFloat(process.env.DAILY_LOSS_LIMIT) || 200;
    this.maxContracts = parseInt(process.env.MAX_CONTRACTS) || 1;
    this.dailyStartBalance = null;
    this.tradesToday = 0;
    this.lastResetDate = null;
    this.killed = false;
  }

  resetIfNewDay() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailyStartBalance = null;
      this.tradesToday = 0;
      this.lastResetDate = today;
      this.killed = false;
    }
  }

  setStartBalance(balance) {
    this.resetIfNewDay();
    if (!this.dailyStartBalance) this.dailyStartBalance = balance;
  }

  checkDailyLoss(currentBalance) {
    if (!this.dailyStartBalance) return { ok: true };
    const loss = this.dailyStartBalance - currentBalance;
    if (loss >= this.dailyLossLimit) {
      this.killed = true;
      return { ok: false, reason: `Daily loss limit reached: -$${loss.toFixed(2)}` };
    }
    return { ok: true };
  }

  canTrade(currentBalance) {
    this.resetIfNewDay();
    if (this.killed) return { ok: false, reason: "Kill switch active" };
    return this.checkDailyLoss(currentBalance);
  }

  getMaxContracts() { return this.maxContracts; }
  recordTrade() { this.tradesToday++; }
  killSwitch() { this.killed = true; }

  getStatus() {
    return {
      killed: this.killed,
      tradesToday: this.tradesToday,
      dailyStartBalance: this.dailyStartBalance,
      dailyLossLimit: this.dailyLossLimit,
      maxContracts: this.maxContracts,
    };
  }
}

module.exports = new RiskManager();