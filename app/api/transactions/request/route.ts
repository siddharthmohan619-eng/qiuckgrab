import { NextRequest, NextResponse } from "next/server";
import { requestTransactionSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";




// POST /api/transactions/request - Request to buy an item
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
    const validationResult = requestTransactionSchema.safeParse({
      ...body,
      buyerId: userId,
    });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { itemId } = validationResult.data;

    // Get item details
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        seller: {
          select: { id: true, verificationStatus: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (item.availabilityStatus !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Item is no longer available" },
        { status: 400 }
      );
    }

    if (item.sellerId === userId) {
      return NextResponse.json(
        { error: "You cannot buy your own item" },
        { status: 400 }
      );
    }

    // Check for existing pending transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        buyerId: userId,
        itemId,
        status: { in: ["REQUESTED", "ACCEPTED", "PAID", "MEETING"] },
      },
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: "You already have a pending transaction for this item" },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        buyerId: userId,
        sellerId: item.sellerId,
        itemId,
        status: "REQUESTED",
        escrowAmount: item.price,
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            photo: true,
            verificationStatus: true,
            trustScore: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            photo: true,
            verificationStatus: true,
            trustScore: true,
          },
        },
        item: true,
      },
    });

    // Update item status to reserved
    await prisma.item.update({
      where: { id: itemId },
      data: { availabilityStatus: "RESERVED" },
    });

    // TODO: Send Socket.io notification to seller
    // socketClient.emit('request', { transactionId: transaction.id, ... })

    return NextResponse.json(
      {
        message: "Item request sent to seller",
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Request transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
