import axios from "axios";
import { BINANCE_API_KEY, BINANCE_API_SECRET } from "../config.js";
import crypto from "crypto";
import { BINANCE_API_URL } from "../config.js";

function extractErrorMessage(error) {
  if (error.response && error.response.data) {
    const { msg } = error.response.data;
    return msg || "Unknown Binance error";
  }
  return error.message || "Unknown error occurred";
}

export async function checkBinanceConnection() {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/api/v3/ping`, {
      headers: {
        "X-MBX-APIKEY": BINANCE_API_KEY,
      },
    });

    if (response.status === 200) {
      console.log("Successfully connected to Binance API");
      return true;
    } else {
      console.error("Failed to connect to Binance API");
      return false;
    }
  } catch (error) {
    console.error("Error connecting to Binance API:", error.message);
    return false;
  }
}

export async function getCryptoPrice(symbol) {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/api/v3/ticker/price`, {
      params: { symbol },
      headers: {
        "X-MBX-APIKEY": BINANCE_API_KEY,
      },
    });
    console.log(`Binance response for ${symbol}:`, response.data);
    return parseFloat(response.data.price);
  } catch (error) {
    console.error(
      `Error fetching ${symbol} price from Binance:`,
      extractErrorMessage(error)
    );
    throw new Error(extractErrorMessage(error));
  }
}

export async function previewOrder(symbol, side, type, quantity, price = null) {
  try {
    const symbolInfo = await getSymbolInfo(symbol);
    const endpoint = "/api/v3/order/test";
    const timestamp = Date.now();

    const quantityPrecision = -Math.log10(symbolInfo.stepSize);
    const adjustedQuantity = parseFloat(quantity).toFixed(quantityPrecision);

    let params = {
      symbol: symbol,
      side: side.toUpperCase(),
      type: type.toUpperCase(),
      timestamp: timestamp,
      quantity: adjustedQuantity,
    };

    if (type.toUpperCase() === "LIMIT") {
      const pricePrecision = symbolInfo.quoteAssetPrecision;
      params.price = parseFloat(price).toFixed(pricePrecision);
      params.timeInForce = "GTC";
    }

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    const signature = crypto
      .createHmac("sha256", BINANCE_API_SECRET)
      .update(queryString)
      .digest("hex");

    const response = await axios({
      method: "POST",
      url: `${BINANCE_API_URL}${endpoint}?${queryString}&signature=${signature}`,
      headers: {
        "X-MBX-APIKEY": BINANCE_API_KEY,
      },
    });

    // Calculate fee (0.1% for taker trades on Binance.US)
    const feeRate = 0.001; // 0.1%
    const currentPrice = await getCryptoPrice(symbol);
    const orderValue = parseFloat(adjustedQuantity) * currentPrice;
    const estimatedFee = orderValue * feeRate;

    return {
      success: true,
      message: "Order preview successful",
      details: {
        symbol,
        side,
        type,
        quantity: adjustedQuantity,
        estimatedFee,
        currentPrice,
        orderValue,
      },
    };
  } catch (error) {
    console.error(
      "Error previewing Binance order:",
      error.response ? error.response.data : error.message
    );
    throw new Error(extractErrorMessage(error));
  }
}

export async function getUSDCPairs() {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/api/v3/exchangeInfo`);
    const symbols = response.data.symbols;
    return symbols
      .filter((symbol) => symbol.quoteAsset === "USDC")
      .map((symbol) => symbol.baseAsset + "-USDC");
  } catch (error) {
    console.error(
      "Error fetching USDC pairs from Binance:",
      extractErrorMessage(error)
    );
    throw new Error(
      `Failed to get USDC pairs from Binance: ${extractErrorMessage(error)}`
    );
  }
}

export async function getSymbolInfo(symbol) {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/api/v3/exchangeInfo`, {
      params: { symbol },
      headers: {
        "X-MBX-APIKEY": BINANCE_API_KEY,
      },
    });
    const symbolInfo = response.data.symbols[0];
    const lotSizeFilter = symbolInfo.filters.find(
      (filter) => filter.filterType === "LOT_SIZE"
    );
    return {
      minQty: parseFloat(lotSizeFilter.minQty),
      maxQty: parseFloat(lotSizeFilter.maxQty),
      stepSize: parseFloat(lotSizeFilter.stepSize),
      baseAssetPrecision: symbolInfo.baseAssetPrecision,
      quoteAssetPrecision: symbolInfo.quoteAssetPrecision,
    };
  } catch (error) {
    console.error(
      `Error fetching symbol info for ${symbol}:`,
      extractErrorMessage(error)
    );
    throw new Error(extractErrorMessage(error));
  }
}
