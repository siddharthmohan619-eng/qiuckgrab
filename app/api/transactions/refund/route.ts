import { NextRequest, NextResponse } from "next/server";
import { refundTransactionSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";




// POST /api/transactions/refund - Request refund
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
    const validationResult = refundTransactionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { transactionId, reason } = validationResult.data;

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        seller: true,
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
        { error: "Only the buyer can request a refund" },
        { status: 403 }
      );
    }

    // Check status - can only refund if PAID and countdown expired, or if in MEETING status
    const canRefund =
      (transaction.status === "PAID" &&
        transaction.countdownEnd &&
        new Date() > transaction.countdownEnd) ||
      transaction.status === "MEETING";

    if (!canRefund) {
      return NextResponse.json(
        {
          error: "Refund not available",
          details: "Refund is only available after meetup timeout or during meetup if item is not as described",
        },
        { status: 400 }
      );
    }

    // Process refund
    // In production, call Razorpay refund API

    const refundId = `refund_${Date.now()}_mock`;

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "REFUNDED",
        refundId,
      },
    });

    // Make item available again
    await prisma.item.update({
      where: { id: transaction.itemId },
      data: { availabilityStatus: "AVAILABLE" },
    });

    // Update seller cancellation rate
    const seller = transaction.seller;
    const totalTransactions = seller.completedDeals + 1;
    const newCancellationRate =
      (seller.cancellationRate * seller.completedDeals + 1) / totalTransactions;

    await prisma.user.update({
      where: { id: transaction.sellerId },
      data: { cancellationRate: newCancellationRate },
    });

    return NextResponse.json({
      message: "Refund processed successfully",
      transaction: updatedTransaction,
      refundId,
      reason: reason || "Meetup timeout",
    });
  } catch (error) {
    console.error("Refund transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
