const axios = require("axios");

const URLS = {
  demo: {
    auth: "https://demo.tradovateapi.com/v1/auth/accesstokenrequest",
    api: "https://demo.tradovateapi.com/v1",
  },
  live: {
    auth: "https://live.tradovateapi.com/v1/auth/accesstokenrequest",
    api: "https://live.tradovateapi.com/v1",
  },
};

class TradovateClient {
  constructor() {
    this.env = process.env.TRADOVATE_ENV || "demo";
    this.urls = URLS[this.env];
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    const res = await axios.post(this.urls.auth, {
      name: process.env.TRADOVATE_USERNAME,
      password: process.env.TRADOVATE_PASSWORD,
      appId: process.env.TRADOVATE_APP_ID,
      appVersion: process.env.TRADOVATE_APP_VERSION || "1.0.0",
      cid: process.env.TRADOVATE_DEVICE_ID,
      deviceId: process.env.TRADOVATE_DEVICE_ID,
      sec: process.env.TRADOVATE_APP_SECRET || "",
    });
    if (!res.data.accessToken) throw new Error("Auth failed");
    this.accessToken = res.data.accessToken;
    this.tokenExpiry = Date.now() + 75 * 60 * 1000;
  }

  async getToken() {
    if (!this.accessToken || Date.now() > this.tokenExpiry) await this.authenticate();
    return this.accessToken;
  }

  async api(method, path, data = null) {
    await this.getToken();
    const config = {
      method, url: `${this.urls.api}${path}`,
      headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" },
    };
    if (data) config.data = data;
    const res = await axios(config);
    return res.data;
  }

  async getAccounts() { return await this.api("GET", "/account/list"); }
  async getAccount() { const a = await this.getAccounts(); return a[0]; }

  async getCashBalance() {
    const account = await this.getAccount();
    const balance = await this.api("GET", `/cashbalance/getcashbalancesnapshot?accountId=${account.id}`);
    return { accountId: account.id, accountName: account.name, cashBalance: balance.cashBalance, unrealizedPnL: balance.openTradeEquity };
  }

  async findContract(symbol) {
    const result = await this.api("GET", `/contract/find?name=${symbol}`);
    if (!result || !result.id) throw new Error(`Contract not found: ${symbol}`);
    return result;
  }

  async getPositions() {
    const account = await this.getAccount();
    return await this.api("GET", `/position/list?accountId=${account.id}`);
  }

  async placeOrder({ symbol, action, contracts, stopLoss, takeProfit }) {
    const account = await this.getAccount();
    const contract = await this.findContract(symbol);
    const orderData = { accountSpec: account.name, accountId: account.id, action, symbol: contract.name, orderQty: contracts, orderType: "Market", isAutomated: true };
    const entry = await this.api("POST", "/order/placeorder", orderData);
    if (stopLoss) await this.api("POST", "/order/placeorder", { ...orderData, action: action === "Buy" ? "Sell" : "Buy", orderType: "Stop", stopPrice: stopLoss });
    if (takeProfit) await this.api("POST", "/order/placeorder", { ...orderData, action: action === "Buy" ? "Sell" : "Buy", orderType: "Limit", price: takeProfit });
    return entry;
  }

  async flattenAll() {
    const account = await this.getAccount();
    return await this.api("POST", "/order/liquidateposition", { accountId: account.id, isAutomated: true });
  }
}

module.exports = new TradovateClient();