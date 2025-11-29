/**
 * AI Search Parser Service
 * Uses Claude NLP to parse natural language search queries
 */

import { callClaudeAPI } from "./claude";

interface ParsedQuery {
  item: string;
  urgency: "low" | "medium" | "high";
  category?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  condition?: string;
  keywords: string[];
}

const SEARCH_PARSER_PROMPT = `You are a search query parser for QuickGrab, a student marketplace.
Parse the user's search query and extract:
1. The main item being searched for
2. Urgency level (low, medium, high) - look for words like "urgent", "asap", "need now"
3. Category if mentioned (electronics, books, furniture, clothing, etc.)
4. Price range if mentioned
5. Condition preference if mentioned (new, used, like new)
6. Key search terms

Return JSON with these fields:
- item: string (the main item)
- urgency: "low" | "medium" | "high"
- category: string | null
- priceRange: { min?: number, max?: number } | null
- condition: string | null
- keywords: string[]`;

export async function parseSearchQuery(query: string): Promise<ParsedQuery> {
  try {
    const response = await callClaudeAPI(
      [
        {
          role: "user",
          content: `Parse this search query: "${query}"
Return structured JSON with item, urgency, category, priceRange, condition, keywords`,
        },
      ],
      SEARCH_PARSER_PROMPT
    );

    try {
      const parsed = JSON.parse(response);
      return {
        item: parsed.item || query,
        urgency: parsed.urgency || "medium",
        category: parsed.category || undefined,
        priceRange: parsed.priceRange || undefined,
        condition: parsed.condition || undefined,
        keywords: parsed.keywords || [query],
      };
    } catch {
      // Fallback parsing for mock mode
      return fallbackQueryParse(query);
    }
  } catch (error) {
    console.error("Search parsing error:", error);
    return fallbackQueryParse(query);
  }
}

function fallbackQueryParse(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase();
  
  // Detect urgency
  let urgency: "low" | "medium" | "high" = "medium";
  if (lowerQuery.includes("urgent") || lowerQuery.includes("asap") || lowerQuery.includes("now")) {
    urgency = "high";
  }

  // Detect category
  const categories: Record<string, string> = {
    phone: "electronics",
    laptop: "electronics",
    charger: "electronics",
    cable: "electronics",
    book: "books",
    textbook: "books",
    desk: "furniture",
    chair: "furniture",
    shirt: "clothing",
    jacket: "clothing",
  };

  let category: string | undefined;
  for (const [keyword, cat] of Object.entries(categories)) {
    if (lowerQuery.includes(keyword)) {
      category = cat;
      break;
    }
  }

  // Extract price range
  let priceRange: { min?: number; max?: number } | undefined;
  const priceMatch = lowerQuery.match(/under\s*\$?(\d+)|below\s*\$?(\d+)|max\s*\$?(\d+)/);
  if (priceMatch) {
    const maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
    priceRange = { max: maxPrice };
  }

  // Extract keywords
  const keywords = query
    .replace(/urgent|asap|need|want|looking for|under \$?\d+/gi, "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  return {
    item: keywords.join(" ") || query,
    urgency,
    category,
    priceRange,
    keywords: keywords.length > 0 ? keywords : [query],
  };
}
