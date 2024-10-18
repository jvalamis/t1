import OpenAI from "openai";
import { OPENAI_API_KEY } from "./config.js";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function getCompletion() {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: "Write a haiku about recursion in programming.",
      },
    ],
  });

  console.log(completion.choices[0].message);
}

export async function checkOpenAIConnection() {
  try {
    const models = await openai.models.list();
    console.log("Connected to OpenAI API");
    return true;
  } catch (error) {
    console.error("Failed to connect to OpenAI API:", error);
    return false;
  }
}

export async function interpretOrderPreview(
  previewData,
  productId,
  side,
  orderConfiguration,
  currentPrice
) {
  // Extract base and quote currencies from productId (e.g., "ETH-USDC" -> ["ETH", "USDC"])
  const [baseCurrency, quoteCurrency] = productId.split("-");

  // Perform calculations
  const orderAmount = parseFloat(previewData.order_total) || 0;
  const feeAmount = parseFloat(previewData.commission_total) || 0;
  const totalCost = orderAmount;
  const baseQuantity = parseFloat(previewData.base_size) || 0;

  const breakEvenPrice = baseQuantity !== 0 ? totalCost / baseQuantity : 0;
  const profitPrice1Dollar =
    baseQuantity !== 0 ? (totalCost + 1) / baseQuantity : 0;
  const profitPrice5Dollars =
    baseQuantity !== 0 ? (totalCost + 5) / baseQuantity : 0;
  const profitPrice10Dollars =
    baseQuantity !== 0 ? (totalCost + 10) / baseQuantity : 0;

  const feePercentage = orderAmount !== 0 ? (feeAmount / orderAmount) * 100 : 0;
  const slippage = parseFloat(previewData.slippage) || 0;

  const interpretation = `
Order Summary:
- ${side.toUpperCase()} ${baseQuantity.toFixed(
    6
  )} ${baseCurrency} for ${totalCost.toFixed(2)} ${quoteCurrency}
- Fee: ${feeAmount.toFixed(4)} ${quoteCurrency} (${feePercentage.toFixed(2)}%)
- Slippage: ${(slippage * 100).toFixed(2)}%

Profit Points (in ${quoteCurrency}):
- Break-even price: ${breakEvenPrice.toFixed(2)}
- $1 profit at: ${profitPrice1Dollar.toFixed(2)}
- $5 profit at: ${profitPrice5Dollars.toFixed(2)}
- $10 profit at: ${profitPrice10Dollars.toFixed(2)}

Current ${baseCurrency} price: ${currentPrice} ${quoteCurrency}
`;

  console.log("Order preview interpretation:");
  console.log(interpretation);

  return interpretation;
}
