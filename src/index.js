import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDatabase } from "./database.js";
import { checkOpenAIConnection } from "./openai.js";
import {
  checkCoinbaseConnection,
  getUSDCPairs as getCoinbaseUSDCPairs,
} from "./coinbase/coinbase.js";
import {
  checkBinanceConnection,
  getUSDCPairs as getBinanceUSDCPairs,
} from "./binance/binance.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting...");

async function getCommonUSDCPairs() {
  try {
    const coinbasePairs = await getCoinbaseUSDCPairs();
    const binancePairs = await getBinanceUSDCPairs();
    return coinbasePairs.filter((pair) => binancePairs.includes(pair));
  } catch (error) {
    console.error("Error fetching common USDC pairs:", error);
    throw error;
  }
}

async function updateCryptoList(commonPairs) {
  const cryptoList = {
    cryptocurrencies: commonPairs.map((pair) => {
      const [symbol] = pair.split("-");
      return {
        symbol,
        name: symbol,
        exchanges: ["coinbase", "binance"],
        coinbasePair: pair,
        binancePair: pair.replace("-", ""),
        increment: 1, // Default USDC amount for each trade
      };
    }),
  };

  const filePath = path.join(__dirname, "..", "cryptoList.json");
  await fs.writeFile(filePath, JSON.stringify(cryptoList, null, 2));
  console.log("cryptoList.json has been generated with common pairs.");
  return cryptoList;
}

async function main() {
  try {
    await connectToDatabase();
    await checkOpenAIConnection();
    const coinbaseConnected = await checkCoinbaseConnection();
    const binanceConnected = await checkBinanceConnection();

    if (!coinbaseConnected || !binanceConnected) {
      throw new Error("Failed to connect to one or more exchanges");
    }

    console.log("All connections established successfully.");

    const commonPairs = await getCommonUSDCPairs();
    const updatedCryptoList = await updateCryptoList(commonPairs);

    // Here you can add more functionality to use the updatedCryptoList
    // For example, you could start monitoring prices or look for arbitrage opportunities
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main().catch(console.error);
