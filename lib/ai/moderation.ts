/**
 * AI Moderation Service
 * Handles chat toxicity detection, scam detection, and dispute resolution
 */

import { callClaudeAPI } from "./claude";

interface ModerationResult {
  isSafe: boolean;
  flags: string[];
  severity: "none" | "low" | "medium" | "high";
  action: "allow" | "warn" | "block" | "review";
}

interface ScamAnalysis {
  isScam: boolean;
  confidence: number;
  indicators: string[];
  recommendation: string;
}

interface DisputeResolution {
  decision: "buyer_favor" | "seller_favor" | "split" | "needs_review";
  confidence: number;
  reasoning: string;
  suggestedAction: string;
}

const MODERATION_PROMPT = `You are a content moderator for QuickGrab, a student marketplace.
Analyze the content for:
1. Toxic language (insults, threats, harassment)
2. Scam indicators (suspicious links, pressure tactics, requests for personal info)
3. Inappropriate content
4. Policy violations

Return JSON with:
- isSafe: boolean
- flags: string[] (list of issues found)
- severity: "none" | "low" | "medium" | "high"
- action: "allow" | "warn" | "block" | "review"`;

const DISPUTE_PROMPT = `You are a dispute resolver for QuickGrab marketplace.
Analyze the transaction evidence and make a fair decision.

Consider:
1. Message history and timestamps
2. Photo evidence if provided
3. Previous behavior patterns
4. Transaction status and timeline

Return JSON with:
- decision: "buyer_favor" | "seller_favor" | "split" | "needs_review"
- confidence: number (0-100)
- reasoning: string
- suggestedAction: string`;

export async function moderateContent(content: string): Promise<ModerationResult> {
  try {
    const response = await callClaudeAPI(
      [
        {
          role: "user",
          content: `Moderate this message: "${content}"`,
        },
      ],
      MODERATION_PROMPT
    );

    try {
      const parsed = JSON.parse(response);
      return {
        isSafe: parsed.isSafe ?? true,
        flags: parsed.flags || [],
        severity: parsed.severity || "none",
        action: parsed.action || "allow",
      };
    } catch {
      return fallbackModeration(content);
    }
  } catch (error) {
    console.error("Moderation error:", error);
    return fallbackModeration(content);
  }
}

function fallbackModeration(content: string): ModerationResult {
  const lowerContent = content.toLowerCase();
  const flags: string[] = [];
  
  // Basic toxicity detection
  const toxicWords = ["stupid", "idiot", "scam", "fake", "threat", "kill"];
  const scamIndicators = ["send money", "western union", "gift card", "wire transfer", "venmo me first"];
  const suspiciousLinks = ["bit.ly", "tinyurl", "click here"];

  for (const word of toxicWords) {
    if (lowerContent.includes(word)) {
      flags.push(`Contains potentially toxic word: ${word}`);
    }
  }

  for (const indicator of scamIndicators) {
    if (lowerContent.includes(indicator)) {
      flags.push(`Possible scam indicator: ${indicator}`);
    }
  }

  for (const link of suspiciousLinks) {
    if (lowerContent.includes(link)) {
      flags.push(`Suspicious link detected: ${link}`);
    }
  }

  const severity = flags.length === 0 ? "none" : flags.length === 1 ? "low" : flags.length < 3 ? "medium" : "high";
  
  return {
    isSafe: flags.length === 0,
    flags,
    severity,
    action: flags.length === 0 ? "allow" : flags.length < 2 ? "warn" : "review",
  };
}

export async function detectScam(
  sellerHistory: {
    cancellationRate: number;
    completedDeals: number;
    avgRating: number;
  },
  transactionDetails: {
    price: number;
    avgMarketPrice: number;
    messageCount: number;
    timeToResponse: number;
  }
): Promise<ScamAnalysis> {
  const indicators: string[] = [];
  let scamScore = 0;

  // High cancellation rate
  if (sellerHistory.cancellationRate > 0.3) {
    indicators.push("High cancellation rate");
    scamScore += 30;
  }

  // Very low rating
  if (sellerHistory.avgRating < 2 && sellerHistory.completedDeals > 5) {
    indicators.push("Poor seller rating");
    scamScore += 25;
  }

  // Price too good to be true (>50% below market)
  if (transactionDetails.price < transactionDetails.avgMarketPrice * 0.5) {
    indicators.push("Price significantly below market value");
    scamScore += 20;
  }

  // Pressure tactics (very fast responses)
  if (transactionDetails.timeToResponse < 5 && transactionDetails.messageCount > 10) {
    indicators.push("Unusually aggressive messaging");
    scamScore += 15;
  }

  // New seller with no history
  if (sellerHistory.completedDeals === 0) {
    indicators.push("New seller with no transaction history");
    scamScore += 10;
  }

  const isScam = scamScore >= 50;
  const confidence = Math.min(scamScore, 95);

  return {
    isScam,
    confidence,
    indicators,
    recommendation: isScam
      ? "High risk transaction. Consider canceling or meeting in a very public place."
      : indicators.length > 0
      ? "Some risk factors detected. Proceed with caution."
      : "Transaction appears safe.",
  };
}

export async function resolveDispute(
  transactionId: string,
  evidence: {
    buyerClaim: string;
    sellerClaim: string;
    messageHistory: string[];
    photos: string[];
    transactionTimeline: Record<string, Date>;
  }
): Promise<DisputeResolution> {
  try {
    const response = await callClaudeAPI(
      [
        {
          role: "user",
          content: `Resolve this dispute for transaction ${transactionId}:

Buyer's claim: ${evidence.buyerClaim}
Seller's claim: ${evidence.sellerClaim}

Message summary: ${evidence.messageHistory.slice(-10).join("\n")}
Number of photos provided: ${evidence.photos.length}

Timeline:
${Object.entries(evidence.transactionTimeline)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

Analyze and provide a fair resolution.`,
        },
      ],
      DISPUTE_PROMPT
    );

    try {
      const parsed = JSON.parse(response);
      return {
        decision: parsed.decision || "needs_review",
        confidence: parsed.confidence || 50,
        reasoning: parsed.reasoning || "Unable to determine from available evidence",
        suggestedAction: parsed.suggestedAction || "Manual review required",
      };
    } catch {
      return fallbackDisputeResolution(evidence);
    }
  } catch (error) {
    console.error("Dispute resolution error:", error);
    return fallbackDisputeResolution(evidence);
  }
}

function fallbackDisputeResolution(evidence: {
  buyerClaim: string;
  sellerClaim: string;
  messageHistory: string[];
  photos: string[];
}): DisputeResolution {
  // Simple heuristics for dispute resolution
  const hasPhotos = evidence.photos.length > 0;
  const hasMessageHistory = evidence.messageHistory.length > 5;

  if (!hasPhotos && !hasMessageHistory) {
    return {
      decision: "needs_review",
      confidence: 30,
      reasoning: "Insufficient evidence to make an automated decision.",
      suggestedAction: "Request additional evidence from both parties.",
    };
  }

  if (evidence.buyerClaim.length > evidence.sellerClaim.length * 2 && hasPhotos) {
    return {
      decision: "buyer_favor",
      confidence: 60,
      reasoning: "Buyer provided more detailed claim with photo evidence.",
      suggestedAction: "Process refund to buyer, warn seller.",
    };
  }

  return {
    decision: "split",
    confidence: 55,
    reasoning: "Both parties present reasonable claims. Fair resolution is to split.",
    suggestedAction: "Refund 50% to buyer, release 50% to seller.",
  };
}

// Overpriced item detection
export function isOverpriced(price: number, avgPrice: number): boolean {
  return price > avgPrice * 2;
}
