import { NextRequest, NextResponse } from "next/server";
import { confirmTransactionSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { calculateTrustScore, getEarnedBadges } from "@/lib/services/trust-engine";




// POST /api/transactions/confirm - Buyer confirms item received
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = confirmTransactionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { transactionId } = validationResult.data;

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        seller: true,
        buyer: true,
        item: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify buyer
    if (transaction.buyerId !== userId) {
      return NextResponse.json(
        { error: "Only the buyer can confirm receipt" },
        { status: 403 }
      );
    }

    // Check status
    if (transaction.status !== "PAID" && transaction.status !== "MEETING") {
      return NextResponse.json(
        { error: `Cannot confirm transaction in ${transaction.status} status` },
        { status: 400 }
      );
    }

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "COMPLETED" },
    });

    // Mark item as sold
    await prisma.item.update({
      where: { id: transaction.itemId },
      data: { availabilityStatus: "SOLD" },
    });

    // Update seller stats
    const seller = transaction.seller;
    const newCompletedDeals = seller.completedDeals + 1;
    const newCancellationRate =
      seller.cancellationRate * seller.completedDeals / newCompletedDeals;

    // Recalculate trust score
    const { score: newTrustScore } = calculateTrustScore({
      verificationStatus: seller.verificationStatus,
      avgRating: seller.avgRating,
      completedDeals: newCompletedDeals,
      cancellationRate: newCancellationRate,
    });

    // Check for new badges
    const newBadges = getEarnedBadges({
      completedDeals: newCompletedDeals,
      avgRating: seller.avgRating,
      cancellationRate: newCancellationRate,
    });

    await prisma.user.update({
      where: { id: transaction.sellerId },
      data: {
        completedDeals: newCompletedDeals,
        cancellationRate: newCancellationRate,
        trustScore: newTrustScore,
        badges: newBadges,
      },
    });

    // Update buyer stats
    const buyer = transaction.buyer;
    await prisma.user.update({
      where: { id: transaction.buyerId },
      data: {
        completedDeals: buyer.completedDeals + 1,
      },
    });

    // TODO: In production, release escrow funds to seller via Razorpay

    return NextResponse.json({
      message: "Transaction completed! Funds released to seller.",
      transaction: updatedTransaction,
      nextStep: "Please rate the seller",
      ratingRequired: true,
    });
  } catch (error) {
    console.error("Confirm transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
