/**
 * AI Service Configuration
 * Uses Claude API for AI-powered features
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
}

export async function callClaudeAPI(
  messages: ClaudeMessage[],
  systemPrompt?: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set, using mock AI response");
    return mockAIResponse(messages[messages.length - 1].content);
  }

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: systemPrompt || "You are a helpful assistant for QuickGrab, an AI-powered student marketplace.",
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data: ClaudeResponse = await response.json();
    return data.content[0]?.text || "";
  } catch (error) {
    console.error("Claude API call failed:", error);
    return mockAIResponse(messages[messages.length - 1].content);
  }
}

// Mock response for development/testing
function mockAIResponse(input: string): string {
  return JSON.stringify({
    status: "mock",
    message: "AI service running in mock mode",
    input: input.substring(0, 100),
  });
}

export { mockAIResponse };
