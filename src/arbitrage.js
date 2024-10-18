import { executeBuyOrder } from "./index.js";
import { executeSellOrder } from "./index.js";
import { transferCrypto } from "./index.js";
import { getCryptoPrice as getCoinbaseCryptoPrice } from "./coinbase/coinbase.js";
import { getCryptoPrice as getBinanceCryptoPrice } from "./binance/binance.js";

export async function executeArbitrage(
  crypto,
  buyExchange,
  sellExchange,
  amount,
  buyPrice,
  sellPrice
) {
  console.log(`Executing arbitrage for ${crypto.symbol}:`);

  try {
    // Fetch current prices
    const currentBuyPrice = await (buyExchange === "coinbase"
      ? getCoinbaseCryptoPrice(crypto.coinbasePair)
      : getBinanceCryptoPrice(crypto.binancePair));
    const currentSellPrice = await (sellExchange === "coinbase"
      ? getCoinbaseCryptoPrice(crypto.coinbasePair)
      : getBinanceCryptoPrice(crypto.binancePair));

    // Use the fetched prices instead of the passed buyPrice and sellPrice
    // Step 1: Buy on the cheaper exchange
    console.log(`1. Buying ${crypto.symbol} on ${buyExchange}`);
    const buyOrder = await executeBuyOrder(crypto.symbol, buyExchange, amount);
    console.log(`   Buy order executed:`);
    console.log(JSON.stringify(buyOrder, null, 2));

    // Calculate the amount of crypto bought
    let cryptoAmount;
    if (buyOrder.executedQty) {
      cryptoAmount = buyOrder.executedQty;
    } else if (buyOrder.filled_size) {
      cryptoAmount = buyOrder.filled_size;
    } else if (buyOrder.size) {
      cryptoAmount = buyOrder.size;
    } else if (buyOrder.amount) {
      cryptoAmount = buyOrder.amount;
    } else if (buyOrder.base_size) {
      cryptoAmount = buyOrder.base_size;
    } else {
      console.error("Unexpected buy order structure:", buyOrder);
      throw new Error(
        `Failed to determine the amount of ${crypto.symbol} bought`
      );
    }

    cryptoAmount = parseFloat(cryptoAmount);

    if (isNaN(cryptoAmount) || cryptoAmount <= 0) {
      throw new Error(
        `Invalid amount of ${crypto.symbol} bought: ${cryptoAmount}`
      );
    }

    console.log(`   Crypto amount bought: ${cryptoAmount} ${crypto.symbol}`);

    // Step 2: Transfer to the more expensive exchange
    console.log(
      `2. Transferring ${cryptoAmount} ${crypto.symbol} from ${buyExchange} to ${sellExchange}`
    );
    const transferResult = await transferCrypto(
      crypto.symbol,
      buyExchange,
      sellExchange,
      cryptoAmount
    );
    console.log(`   Transfer completed:`);
    console.log(JSON.stringify(transferResult, null, 2));

    // Step 3: Sell on the more expensive exchange
    console.log(`3. Selling ${crypto.symbol} on ${sellExchange}`);
    const sellOrder = await executeSellOrder(
      crypto.symbol,
      sellExchange,
      transferResult.receivedQty
    );
    console.log(`   Sell order executed:`);
    console.log(JSON.stringify(sellOrder, null, 2));

    // Calculate profit
    const buyTotal = cryptoAmount * currentBuyPrice;
    const sellTotal =
      parseFloat(
        sellOrder.executedQty ||
          sellOrder.filled_size ||
          sellOrder.size ||
          sellOrder.amount ||
          sellOrder.base_size
      ) * currentSellPrice;
    const profit =
      sellTotal - buyTotal - buyOrder.fee - sellOrder.fee - transferResult.fee;

    console.log(`Arbitrage completed:`);
    console.log(`  Profit: $${profit.toFixed(2)}`);
    return { profit, buyOrder, sellOrder, transferResult };
  } catch (error) {
    console.error(`Error during arbitrage execution:`);
    console.error(`  ${error.message}`);
    throw error;
  }
}
