/**
 * AI Meetup Suggestions Service
 * Suggests safe meetup locations between buyer and seller
 */

import { callClaudeAPI } from "./claude";

interface MeetupLocation {
  name: string;
  address: string;
  type: string;
  distance: number; // in meters
  safetyRating: number; // 1-5
  reasoning: string;
}

interface MeetupSuggestion {
  locations: MeetupLocation[];
  suggestedTime: string;
  safetyTips: string[];
}

const MEETUP_PROMPT = `You are a location advisor for QuickGrab, a student marketplace.
Suggest safe meetup locations for a campus transaction.

Prioritize:
1. Well-lit, public spaces
2. Campus locations (libraries, student centers, cafeterias)
3. Security camera presence
4. Daytime availability
5. Midpoint between both parties

Return JSON with:
- locations: array of { name, address, type, safetyRating (1-5), reasoning }
- suggestedTime: recommended meetup time window
- safetyTips: array of safety reminders`;

// Campus safe spots database (MVP mock data)
const CAMPUS_SAFE_SPOTS = [
  {
    name: "Main Library Entrance",
    type: "library",
    safetyRating: 5,
    features: ["security cameras", "well-lit", "high foot traffic", "campus security nearby"],
  },
  {
    name: "Student Union Building",
    type: "student_center",
    safetyRating: 5,
    features: ["open late", "cafeteria", "security desk", "busy area"],
  },
  {
    name: "Campus Coffee Shop",
    type: "cafe",
    safetyRating: 4,
    features: ["public seating", "staff present", "daytime hours"],
  },
  {
    name: "Recreation Center Lobby",
    type: "rec_center",
    safetyRating: 4,
    features: ["check-in desk", "cameras", "student ID required"],
  },
  {
    name: "Campus Police Station",
    type: "police",
    safetyRating: 5,
    features: ["designated safe exchange zone", "cameras", "police presence"],
  },
];

export async function suggestMeetupLocations(
  buyerLocation: { lat: number; lng: number } | null,
  sellerLocation: { lat: number; lng: number } | null,
  _campusName?: string
): Promise<MeetupSuggestion> {
  // Calculate midpoint if both locations available
  let midpoint: { lat: number; lng: number } | null = null;
  if (buyerLocation && sellerLocation) {
    midpoint = {
      lat: (buyerLocation.lat + sellerLocation.lat) / 2,
      lng: (buyerLocation.lng + sellerLocation.lng) / 2,
    };
  }

  try {
    const response = await callClaudeAPI(
      [
        {
          role: "user",
          content: `Suggest 3 safe meetup locations for a campus transaction.
${midpoint ? `Midpoint coordinates: ${midpoint.lat}, ${midpoint.lng}` : "Location data not available"}
Prioritize public, well-lit campus locations.`,
        },
      ],
      MEETUP_PROMPT
    );

    try {
      const parsed = JSON.parse(response);
      return {
        locations: parsed.locations || generateFallbackLocations(midpoint),
        suggestedTime: parsed.suggestedTime || "2:00 PM - 5:00 PM (daylight hours)",
        safetyTips: parsed.safetyTips || getDefaultSafetyTips(),
      };
    } catch {
      return {
        locations: generateFallbackLocations(midpoint),
        suggestedTime: "2:00 PM - 5:00 PM (daylight hours)",
        safetyTips: getDefaultSafetyTips(),
      };
    }
  } catch (error) {
    console.error("Meetup suggestion error:", error);
    return {
      locations: generateFallbackLocations(midpoint),
      suggestedTime: "2:00 PM - 5:00 PM (daylight hours)",
      safetyTips: getDefaultSafetyTips(),
    };
  }
}

function generateFallbackLocations(
  midpoint: { lat: number; lng: number } | null
): MeetupLocation[] {
  return CAMPUS_SAFE_SPOTS.slice(0, 3).map((spot, index) => ({
    name: spot.name,
    address: "Campus Main Building",
    type: spot.type,
    distance: midpoint ? 100 + index * 50 : 200,
    safetyRating: spot.safetyRating,
    reasoning: `${spot.features.slice(0, 2).join(", ")}. Great for campus transactions.`,
  }));
}

function getDefaultSafetyTips(): string[] {
  return [
    "Meet during daylight hours when possible",
    "Choose a public, well-lit location",
    "Inform a friend of your meetup time and location",
    "Inspect the item before completing the transaction",
    "Use the in-app payment system for escrow protection",
    "Trust your instincts - if something feels off, cancel",
  ];
}

// Format meetup time suggestion based on current time
export function formatMeetupTimeWindow(preferredTime?: Date): string {
  const now = preferredTime || new Date();
  const hour = now.getHours();

  if (hour < 12) {
    return "12:00 PM - 3:00 PM today";
  } else if (hour < 16) {
    return "Within the next 2 hours";
  } else if (hour < 19) {
    return "Before sunset today";
  } else {
    return "Tomorrow 11:00 AM - 3:00 PM";
  }
}
