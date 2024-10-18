// Market order examples
export const marketOrderBuy = {
  market_market_ioc: {
    quote_size: "100", // Buy $20 worth of ETH using USDC
  },
};

export const marketOrderSell = {
  market_market_ioc: {
    base_size: "0.01", // Sell 0.01 of the base asset (e.g., 0.01 BTC)
  },
};

// Limit order examples
export const limitOrderBuy = {
  limit_limit_gtc: {
    base_size: "0.01", // Buy 0.01 of the base asset
    limit_price: "30000", // at $30,000 per unit
  },
};

export const limitOrderSell = {
  limit_limit_gtc: {
    base_size: "0.01", // Sell 0.01 of the base asset
    limit_price: "35000", // at $35,000 per unit
    post_only: true, // Ensure the order is posted as a maker order
  },
};

// Stop limit order examples
export const stopLimitBuy = {
  stop_limit_stop_limit_gtc: {
    base_size: "0.01",
    limit_price: "31000",
    stop_price: "30000",
    stop_direction: "STOP_DIRECTION_STOP_UP",
  },
};

export const stopLimitSell = {
  stop_limit_stop_limit_gtc: {
    base_size: "0.01",
    limit_price: "29000",
    stop_price: "30000",
    stop_direction: "STOP_DIRECTION_STOP_DOWN",
  },
};

// Time-in-force limit order example (Good-til-date)
export const limitOrderGTD = {
  limit_limit_gtd: {
    base_size: "0.01",
    limit_price: "32000",
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  },
};

// Fill-or-kill limit order example
export const limitOrderFOK = {
  limit_limit_fok: {
    base_size: "0.01",
    limit_price: "30000",
  },
};

// Bracket order example
export const bracketOrder = {
  trigger_bracket_gtc: {
    base_size: "0.01",
    limit_price: "30000",
    stop_trigger_price: "29000",
  },
};

// Example usage in your main application:
// import { marketOrderBuy } from './coinbase/orderExamples.js';
// await previewOrder("BTC-USD", "buy", marketOrderBuy);
