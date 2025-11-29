/**
 * AI Price Checker Service
 * Validates pricing against campus averages
 */

import { callClaudeAPI } from "./claude";

interface PriceCheckResult {
  rating: "Fair" | "Overpriced" | "Underpriced" | "Great Deal";
  percentageDiff: number;
  averagePrice: number;
  explanation: string;
}

const PRICE_CHECK_PROMPT = `You are a price analyst for QuickGrab, a student marketplace.
Analyze the given item and price to determine if it's fairly priced compared to typical campus/secondhand market prices.

Consider:
1. Original retail price of item
2. Condition depreciation
3. Campus marketplace typical pricing
4. Seasonal demand

Return JSON with:
- rating: "Fair" | "Overpriced" | "Underpriced" | "Great Deal"
- percentageDiff: number (how much above/below average, negative for underpriced)
- averagePrice: number (estimated fair market price)
- explanation: string (brief explanation)`;

// Campus price database (for MVP, mock data - in production this would be database-driven)
const CAMPUS_PRICE_ESTIMATES: Record<string, { avgPrice: number; category: string }> = {
  "iphone charger": { avgPrice: 15, category: "electronics" },
  "laptop charger": { avgPrice: 35, category: "electronics" },
  "usb cable": { avgPrice: 8, category: "electronics" },
  "textbook": { avgPrice: 45, category: "books" },
  "calculator": { avgPrice: 25, category: "electronics" },
  "headphones": { avgPrice: 40, category: "electronics" },
  "desk lamp": { avgPrice: 20, category: "furniture" },
  "chair": { avgPrice: 50, category: "furniture" },
  "backpack": { avgPrice: 30, category: "accessories" },
  "bike": { avgPrice: 100, category: "transportation" },
};

export async function checkItemPrice(
  itemName: string,
  price: number,
  condition: string = "good"
): Promise<PriceCheckResult> {
  try {
    const response = await callClaudeAPI(
      [
        {
          role: "user",
          content: `Check if this price is fair:
Item: ${itemName}
Listed Price: $${price}
Condition: ${condition}

Analyze and return pricing assessment JSON.`,
        },
      ],
      PRICE_CHECK_PROMPT
    );

    try {
      const parsed = JSON.parse(response);
      return {
        rating: parsed.rating || "Fair",
        percentageDiff: parsed.percentageDiff || 0,
        averagePrice: parsed.averagePrice || price,
        explanation: parsed.explanation || "Price analysis unavailable",
      };
    } catch {
      // Fallback pricing logic
      return fallbackPriceCheck(itemName, price, condition);
    }
  } catch (error) {
    console.error("Price check error:", error);
    return fallbackPriceCheck(itemName, price, condition);
  }
}

function fallbackPriceCheck(
  itemName: string,
  price: number,
  condition: string
): PriceCheckResult {
  // Find best matching category
  const lowerName = itemName.toLowerCase();
  let avgPrice = price; // Default to listed price if no match

  for (const [key, data] of Object.entries(CAMPUS_PRICE_ESTIMATES)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      avgPrice = data.avgPrice;
      break;
    }
  }

  // Adjust for condition
  const conditionMultiplier: Record<string, number> = {
    new: 1.2,
    "like new": 1.0,
    good: 0.85,
    fair: 0.7,
    poor: 0.5,
  };

  const adjustedAvg = avgPrice * (conditionMultiplier[condition.toLowerCase()] || 0.85);
  const percentageDiff = ((price - adjustedAvg) / adjustedAvg) * 100;

  let rating: PriceCheckResult["rating"];
  let explanation: string;

  if (percentageDiff > 30) {
    rating = "Overpriced";
    explanation = `This item is priced ${Math.abs(Math.round(percentageDiff))}% above the typical campus price.`;
  } else if (percentageDiff > 10) {
    rating = "Fair";
    explanation = "Price is slightly above average but within acceptable range.";
  } else if (percentageDiff > -10) {
    rating = "Fair";
    explanation = "Price is in line with typical campus marketplace prices.";
  } else if (percentageDiff > -30) {
    rating = "Underpriced";
    explanation = "Good value! This is priced below average.";
  } else {
    rating = "Great Deal";
    explanation = `Excellent price! ${Math.abs(Math.round(percentageDiff))}% below typical campus price.`;
  }

  return {
    rating,
    percentageDiff: Math.round(percentageDiff),
    averagePrice: Math.round(adjustedAvg),
    explanation,
  };
}

// Update average prices based on completed transactions
export function updateAveragePrices(
  _itemCategory: string,
  _soldPrice: number
): void {
  // In production, this would update the database
  // For MVP, prices are static
  console.log("Price update logged for analytics");
}
