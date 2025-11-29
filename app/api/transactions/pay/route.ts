import { NextRequest, NextResponse } from "next/server";
import { payTransactionSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const MEETUP_TIMEOUT_HOURS = 24; // Time for meetup before auto-refund option



// POST /api/transactions/pay - Buyer pays for item (escrow lock)
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
    const validationResult = payTransactionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { transactionId, paymentId } = validationResult.data;

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
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
        { error: "Only the buyer can pay for this transaction" },
        { status: 403 }
      );
    }

    // Check status
    if (transaction.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: `Cannot pay for transaction in ${transaction.status} status` },
        { status: 400 }
      );
    }

    // In production, verify payment with Razorpay
    // For MVP, we'll accept the payment ID as-is

    // Set countdown for meetup
    const countdownStart = new Date();
    const countdownEnd = new Date(Date.now() + MEETUP_TIMEOUT_HOURS * 60 * 60 * 1000);

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "PAID",
        paymentId,
        countdownStart,
        countdownEnd,
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        item: true,
      },
    });

    // TODO: Send Socket.io notification - payment_locked

    return NextResponse.json({
      message: "Payment secured in escrow. Please arrange meetup.",
      transaction: updatedTransaction,
      countdown: {
        start: countdownStart,
        end: countdownEnd,
        hoursRemaining: MEETUP_TIMEOUT_HOURS,
      },
    });
  } catch (error) {
    console.error("Pay transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
