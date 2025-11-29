/**
 * Trust Score Engine
 * Calculates user trust scores based on idea.md formula:
 * Trust Score = 20 (verification) + 40 (ratings) + 20 (deal volume) + 20 (reliability)
 */

interface TrustScoreComponents {
  verificationScore: number;    // 0-20
  ratingsScore: number;         // 0-40
  dealVolumeScore: number;      // 0-20
  reliabilityScore: number;     // 0-20
}

interface BadgeEligibility {
  badge: string;
  emoji: string;
  eligible: boolean;
  description: string;
}

// Constants for badge eligibility
const QUICK_RESPONDER_MAX_SECONDS = 300; // 5 minutes average response time

// Badge definitions from idea.md
const BADGES = {
  TRUSTED_SELLER: { name: "Trusted Seller", emoji: "🏆", minDeals: 50, minRating: 4.8 },
  QUICK_RESPONDER: { name: "Quick Responder", emoji: "⚡", avgResponseTime: QUICK_RESPONDER_MAX_SECONDS },
  FAIR_PRICER: { name: "Fair Pricer", emoji: "💎", minFairPriceRate: 0.9 },
  PERFECT_SUCCESS: { name: "100% Success Rate", emoji: "🎯", successRate: 1.0 },
};

export function calculateTrustScore(user: {
  verificationStatus: string;
  avgRating: number;
  completedDeals: number;
  cancellationRate: number;
}): { score: number; components: TrustScoreComponents } {
  // Verification Score (0-20)
  const verificationScore = user.verificationStatus === "VERIFIED" ? 20 : 0;

  // Ratings Score (0-40)
  // Based on average rating out of 5 stars
  const ratingsScore = Math.min(40, (user.avgRating / 5) * 40);

  // Deal Volume Score (0-20)
  // Scales with completed deals, max at 100 deals
  const dealVolumeScore = Math.min(20, (user.completedDeals / 100) * 20);

  // Reliability Score (0-20)
  // Based on inverse of cancellation rate
  const reliabilityScore = Math.max(0, 20 * (1 - user.cancellationRate));

  const totalScore = Math.round(
    verificationScore + ratingsScore + dealVolumeScore + reliabilityScore
  );

  return {
    score: totalScore,
    components: {
      verificationScore,
      ratingsScore: Math.round(ratingsScore),
      dealVolumeScore: Math.round(dealVolumeScore),
      reliabilityScore: Math.round(reliabilityScore),
    },
  };
}

export function checkBadgeEligibility(user: {
  completedDeals: number;
  avgRating: number;
  cancellationRate: number;
  avgResponseTime?: number;
  fairPriceRate?: number;
}): BadgeEligibility[] {
  const eligibilities: BadgeEligibility[] = [];

  // Trusted Seller
  eligibilities.push({
    badge: BADGES.TRUSTED_SELLER.name,
    emoji: BADGES.TRUSTED_SELLER.emoji,
    eligible:
      user.completedDeals >= BADGES.TRUSTED_SELLER.minDeals &&
      user.avgRating >= BADGES.TRUSTED_SELLER.minRating,
    description: `Complete ${BADGES.TRUSTED_SELLER.minDeals}+ deals with ${BADGES.TRUSTED_SELLER.minRating}+ rating`,
  });

  // Quick Responder
  eligibilities.push({
    badge: BADGES.QUICK_RESPONDER.name,
    emoji: BADGES.QUICK_RESPONDER.emoji,
    eligible: (user.avgResponseTime || Infinity) <= BADGES.QUICK_RESPONDER.avgResponseTime,
    description: "Respond within 5 minutes on average",
  });

  // Fair Pricer
  eligibilities.push({
    badge: BADGES.FAIR_PRICER.name,
    emoji: BADGES.FAIR_PRICER.emoji,
    eligible: (user.fairPriceRate || 0) >= BADGES.FAIR_PRICER.minFairPriceRate,
    description: "90%+ of listings rated as fair price",
  });

  // Perfect Success Rate
  eligibilities.push({
    badge: BADGES.PERFECT_SUCCESS.name,
    emoji: BADGES.PERFECT_SUCCESS.emoji,
    eligible:
      user.completedDeals >= 10 &&
      user.cancellationRate === 0,
    description: "Complete 10+ deals with 0% cancellation",
  });

  return eligibilities;
}

export function getEarnedBadges(user: {
  completedDeals: number;
  avgRating: number;
  cancellationRate: number;
  avgResponseTime?: number;
  fairPriceRate?: number;
}): string[] {
  return checkBadgeEligibility(user)
    .filter((b) => b.eligible)
    .map((b) => `${b.emoji} ${b.badge}`);
}

export function formatTrustLevel(score: number): {
  level: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      level: "Exceptional",
      color: "text-green-600",
      description: "Highly trusted community member",
    };
  } else if (score >= 70) {
    return {
      level: "Trusted",
      color: "text-blue-600",
      description: "Reliable marketplace participant",
    };
  } else if (score >= 50) {
    return {
      level: "Established",
      color: "text-yellow-600",
      description: "Building trust in the community",
    };
  } else if (score >= 20) {
    return {
      level: "New",
      color: "text-gray-500",
      description: "New to the platform",
    };
  } else {
    return {
      level: "Unverified",
      color: "text-red-500",
      description: "Not yet verified",
    };
  }
}

// Update trust score after transaction
export function calculateNewTrustScore(
  currentUser: {
    verificationStatus: string;
    avgRating: number;
    completedDeals: number;
    cancellationRate: number;
  },
  newRating: number
): number {
  // Recalculate average rating with new rating
  const totalRatings = currentUser.avgRating * currentUser.completedDeals;
  const newAvgRating =
    (totalRatings + newRating) / (currentUser.completedDeals + 1);

  const updatedUser = {
    ...currentUser,
    avgRating: newAvgRating,
    completedDeals: currentUser.completedDeals + 1,
  };

  return calculateTrustScore(updatedUser).score;
}
