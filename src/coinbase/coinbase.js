import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { COINBASE_API_TOKEN, COINBASESECRET } from "../config.js";

const API_URL = "https://api.coinbase.com";

function extractErrorMessage(error) {
  if (error.response && error.response.data && error.response.data.errors) {
    const { message } = error.response.data.errors[0];
    return message || "Unknown Coinbase error";
  }
  return error.message || "Unknown error occurred";
}

function generateJWT(method, requestPath) {
  const key_name = COINBASE_API_TOKEN;
  const key_secret = COINBASESECRET;
  const url = "api.coinbase.com";
  const algorithm = "ES256";
  const uri = method + " " + url + requestPath;

  return jwt.sign(
    {
      iss: "cdp",
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
      sub: key_name,
      uri,
    },
    key_secret,
    {
      algorithm,
      header: {
        kid: key_name,
        nonce: crypto.randomBytes(16).toString("hex"),
      },
    }
  );
}

async function makeRequest(method, endpoint, body = null, options = {}) {
  const { version = "v3", brokerage = true } = options;
  const requestPath = brokerage
    ? `/api/${version}/brokerage${endpoint}`
    : endpoint;

  const fullUrl = `${API_URL}${requestPath}`;
  const jwt = generateJWT(method, requestPath);

  const config = {
    method,
    url: fullUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    data: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(
      `Coinbase API request failed: ${extractErrorMessage(error)}`
    );
  }
}

async function getPortfolio() {
  try {
    const response = await makeRequest("GET", "/accounts", null, {
      brokerage: false,
    });
    return response.data
      .filter((account) => parseFloat(account.balance.amount) > 0)
      .map((account) => ({
        id: account.id,
        name: account.name,
        balance: account.balance,
        currency: account.currency.code,
        type: account.type,
      }));
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

async function getProductTicker(productId = "BTC-USD") {
  try {
    return await makeRequest("GET", `/products/${productId}/ticker`);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

async function checkCoinbaseConnection() {
  try {
    console.log("Attempting to connect to Coinbase API...");
    await getKeyPermissions();
    console.log("Successfully connected to Coinbase API");
    return true;
  } catch (error) {
    console.error(
      "Failed to connect to Coinbase API:",
      extractErrorMessage(error)
    );
    return false;
  }
}

async function getKeyPermissions() {
  return await makeRequest("GET", "/key_permissions");
}

async function getETHUSDPrice() {
  try {
    const response = await axios.get(`${API_URL}/v2/prices/ETH-USD/spot`);
    return response.data.data.amount;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

async function placeMarketOrder(productId, side, funds) {
  try {
    const orderData = {
      product_id: productId,
      side: side,
      type: "market",
      funds: funds.toString(),
    };
    return await makeRequest("POST", "/orders", orderData);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

async function previewOrder(productId, side, orderConfiguration) {
  try {
    const requestBody = {
      product_id: productId,
      side: side.toUpperCase(),
      order_configuration: orderConfiguration,
    };
    const response = await makeRequest("POST", "/orders/preview", requestBody);
    const currentPrice = await getETHUSDPrice();

    return {
      rawPreview: response,
      currentPrice,
    };
  } catch (error) {
    console.error(
      "Error previewing Coinbase order:",
      extractErrorMessage(error)
    );
    throw error;
  }
}

async function getCryptoPrice(currency) {
  try {
    const response = await makeRequest("GET", `/products/${currency}/ticker`);
    console.log(`Coinbase response for ${currency}:`, response);
    return response.price;
  } catch (error) {
    console.error(
      `Error fetching ${currency} price from Coinbase:`,
      extractErrorMessage(error)
    );
    throw new Error(
      `Failed to get ${currency} price from Coinbase: ${extractErrorMessage(
        error
      )}`
    );
  }
}

async function getUSDCPairs() {
  try {
    const response = await makeRequest("GET", "/products");
    return response.products
      .filter((product) => product.quote_currency_id === "USDC")
      .map((product) => product.product_id);
  } catch (error) {
    console.error(
      "Error fetching USDC pairs from Coinbase:",
      extractErrorMessage(error)
    );
    throw new Error(
      `Failed to get USDC pairs from Coinbase: ${extractErrorMessage(error)}`
    );
  }
}

async function getSymbolInfo(symbol) {
  try {
    const response = await makeRequest("GET", `/products/${symbol}-USDC`);
    return {
      minQty: parseFloat(response.base_min_size),
      maxQty: parseFloat(response.base_max_size),
      stepSize: parseFloat(response.base_increment),
      baseAssetPrecision: response.base_increment.split(".")[1].length,
      quoteAssetPrecision: response.quote_increment.split(".")[1].length,
    };
  } catch (error) {
    console.error(
      `Error fetching symbol info for ${symbol}:`,
      extractErrorMessage(error)
    );
    throw new Error(
      `Failed to get symbol info for ${symbol}: ${extractErrorMessage(error)}`
    );
  }
}

// Export all functions
export {
  getPortfolio,
  getProductTicker,
  checkCoinbaseConnection,
  getKeyPermissions,
  getETHUSDPrice,
  placeMarketOrder,
  previewOrder,
  getCryptoPrice,
  getUSDCPairs,
  getSymbolInfo,
};
