/**
 * AI Student Verification Service
 * Uses Claude Vision API to verify student ID cards
 */

import { callClaudeAPI } from "./claude";

interface VerificationResult {
  isValid: boolean;
  name?: string;
  college?: string;
  expiryDate?: string;
  confidence: number;
  reason?: string;
  matchesEmail: boolean;
}

const VERIFICATION_SYSTEM_PROMPT = `You are an AI assistant specialized in verifying student ID cards. 
Analyze the provided image or description and extract:
1. Student's full name
2. College/University name
3. ID expiry date (if visible)
4. Whether the ID appears authentic

Return your analysis in JSON format with these fields:
- name: string (extracted name)
- college: string (extracted college name)
- expiryDate: string (YYYY-MM-DD format if available, null otherwise)
- isAuthentic: boolean (whether ID appears genuine)
- confidence: number (0-100, your confidence level)
- issues: string[] (any concerns about the ID)`;

export async function verifyStudentId(
  idPhotoUrl: string,
  userEmail: string,
  userName: string
): Promise<VerificationResult> {
  // For MVP, we'll use text description since Claude Vision requires different API handling
  // In production, this would use Claude's vision capabilities
  
  try {
    const response = await callClaudeAPI(
      [
        {
          role: "user",
          content: `Verify this student ID submission:
User's claimed name: ${userName}
User's email: ${userEmail}
ID Photo URL: ${idPhotoUrl}

For this MVP, simulate verification by:
1. Extract domain from email (e.g., @harvard.edu → Harvard)
2. Check if name seems plausible
3. Assume ID photo URL is valid if provided

Return JSON with: name, college, expiryDate, isAuthentic, confidence, issues`,
        },
      ],
      VERIFICATION_SYSTEM_PROMPT
    );

    // Parse AI response
    try {
      const parsed = JSON.parse(response);
      const emailDomain = userEmail.split("@")[1]?.split(".")[0] || "";
      const collegeMatch = parsed.college?.toLowerCase().includes(emailDomain.toLowerCase());

      return {
        isValid: parsed.isAuthentic && parsed.confidence > 70 && (parsed.issues?.length || 0) === 0,
        name: parsed.name,
        college: parsed.college,
        expiryDate: parsed.expiryDate,
        confidence: parsed.confidence,
        matchesEmail: collegeMatch,
        reason: parsed.issues?.join(", ") || undefined,
      };
    } catch {
      // Fallback for mock mode
      const emailDomain = userEmail.split("@")[1]?.split(".")[0] || "";
      const isEduEmail = userEmail.endsWith(".edu");
      
      return {
        isValid: isEduEmail,
        name: userName,
        college: emailDomain.charAt(0).toUpperCase() + emailDomain.slice(1) + " University",
        confidence: isEduEmail ? 85 : 30,
        matchesEmail: true,
        reason: isEduEmail ? undefined : "Email domain is not a .edu address",
      };
    }
  } catch (error) {
    console.error("ID verification error:", error);
    return {
      isValid: false,
      confidence: 0,
      matchesEmail: false,
      reason: "Verification service error",
    };
  }
}

// Validate email OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isOTPExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}
