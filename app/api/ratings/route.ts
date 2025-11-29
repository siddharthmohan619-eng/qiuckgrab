import { NextRequest, NextResponse } from "next/server";
import { createRatingSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { calculateTrustScore, getEarnedBadges } from "@/lib/services/trust-engine";




// POST /api/ratings - Create a new rating
export async function POST(request: NextRequest) {
  try {
    const fromUserId = await getUserFromRequest(request);
    if (!fromUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = createRatingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { userId, transactionId, stars, comment } = validationResult.data;

    // Verify transaction exists and is completed
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Can only rate after transaction is completed" },
        { status: 400 }
      );
    }

    // Verify user is part of the transaction
    const isBuyer = transaction.buyerId === fromUserId;
    const isSeller = transaction.sellerId === fromUserId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: "You are not part of this transaction" },
        { status: 403 }
      );
    }

    // Verify rating target is the other party
    const expectedTarget = isBuyer ? transaction.sellerId : transaction.buyerId;
    if (userId !== expectedTarget) {
      return NextResponse.json(
        { error: "Invalid rating target" },
        { status: 400 }
      );
    }

    // Check for existing rating
    const existingRating = await prisma.rating.findFirst({
      where: {
        userId,
        fromUserId,
      },
    });

    if (existingRating) {
      return NextResponse.json(
        { error: "You have already rated this user" },
        { status: 400 }
      );
    }

    // Create rating
    const rating = await prisma.rating.create({
      data: {
        userId,
        fromUserId,
        stars,
        comment: comment || null,
      },
    });

    // Update user's average rating
    const allRatings = await prisma.rating.findMany({
      where: { userId },
      select: { stars: true },
    });

    const avgRating =
      allRatings.reduce((sum: number, r: { stars: number }) => sum + r.stars, 0) / allRatings.length;

    // Get user for trust score calculation
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      // Recalculate trust score
      const { score: newTrustScore } = calculateTrustScore({
        verificationStatus: user.verificationStatus,
        avgRating,
        completedDeals: user.completedDeals,
        cancellationRate: user.cancellationRate,
      });

      // Check for new badges
      const newBadges = getEarnedBadges({
        completedDeals: user.completedDeals,
        avgRating,
        cancellationRate: user.cancellationRate,
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          avgRating,
          trustScore: newTrustScore,
          badges: newBadges,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Rating submitted successfully",
        rating,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create rating error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/ratings - Get ratings for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;
    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              photo: true,
              verificationStatus: true,
            },
          },
        },
      }),
      prisma.rating.count({ where: { userId } }),
    ]);

    // Calculate stats
    const allRatings = await prisma.rating.findMany({
      where: { userId },
      select: { stars: true },
    });

    const stats = {
      average: allRatings.length > 0
        ? allRatings.reduce((sum: number, r: { stars: number }) => sum + r.stars, 0) / allRatings.length
        : 0,
      total: allRatings.length,
      distribution: {
        5: allRatings.filter((r: { stars: number }) => r.stars === 5).length,
        4: allRatings.filter((r: { stars: number }) => r.stars === 4).length,
        3: allRatings.filter((r: { stars: number }) => r.stars === 3).length,
        2: allRatings.filter((r: { stars: number }) => r.stars === 2).length,
        1: allRatings.filter((r: { stars: number }) => r.stars === 1).length,
      },
    };

    return NextResponse.json({
      ratings,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get ratings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
