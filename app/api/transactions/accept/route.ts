import { NextRequest, NextResponse } from "next/server";
import { acceptTransactionSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";




// POST /api/transactions/accept - Seller accepts transaction
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
    const validationResult = acceptTransactionSchema.safeParse(body);
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
        item: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify seller
    if (transaction.sellerId !== userId) {
      return NextResponse.json(
        { error: "Only the seller can accept this transaction" },
        { status: 403 }
      );
    }

    // Check status
    if (transaction.status !== "REQUESTED") {
      return NextResponse.json(
        { error: `Cannot accept transaction in ${transaction.status} status` },
        { status: 400 }
      );
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "ACCEPTED" },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            photo: true,
            trustScore: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            photo: true,
            trustScore: true,
          },
        },
        item: true,
      },
    });

    // TODO: Send Socket.io notification to buyer
    // Open chat room

    return NextResponse.json({
      message: "Transaction accepted. Chat is now open.",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Accept transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
