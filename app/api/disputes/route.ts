import { NextRequest, NextResponse } from "next/server";
import { createDisputeSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { resolveDispute } from "@/lib/ai/moderation";




// POST /api/disputes - Create a new dispute
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
    const validationResult = createDisputeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { transactionId, evidenceText, photos } = validationResult.data;

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: { content: true, senderId: true, createdAt: true },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify user is part of transaction
    const isBuyer = transaction.buyerId === userId;
    const isSeller = transaction.sellerId === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: "You are not part of this transaction" },
        { status: 403 }
      );
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findFirst({
      where: { transactionId },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: "A dispute already exists for this transaction" },
        { status: 400 }
      );
    }

    // Check transaction status - can only dispute paid/meeting transactions
    if (!["PAID", "MEETING"].includes(transaction.status)) {
      return NextResponse.json(
        { error: "Can only dispute transactions that are paid or in meetup phase" },
        { status: 400 }
      );
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        transactionId,
        evidenceText,
        photos: photos || [],
      },
    });

    // Run AI arbitration
    const messageHistory = transaction.messages.map(
      (m: { createdAt: Date; senderId: string; content: string }) => `[${m.createdAt.toISOString()}] ${m.senderId}: ${m.content}`
    );

    const aiResolution = await resolveDispute(transactionId, {
      buyerClaim: isBuyer ? evidenceText : "",
      sellerClaim: isSeller ? evidenceText : "",
      messageHistory,
      photos: photos || [],
      transactionTimeline: {
        created: transaction.createdAt,
        ...(transaction.countdownStart && { paymentLocked: transaction.countdownStart }),
      },
    });

    // Update dispute with AI analysis
    const updatedDispute = await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        aiSummary: aiResolution.reasoning,
        confidence: aiResolution.confidence,
        // Only auto-resolve if confidence is high
        decision: aiResolution.confidence > 80 ? (
          aiResolution.decision === "buyer_favor" ? "BUYER_FAVOR" :
          aiResolution.decision === "seller_favor" ? "SELLER_FAVOR" :
          aiResolution.decision === "split" ? "SPLIT" : "PENDING"
        ) : "PENDING",
        ...(aiResolution.confidence > 80 && { resolvedAt: new Date() }),
      },
    });

    return NextResponse.json(
      {
        message: aiResolution.confidence > 80
          ? "Dispute resolved automatically"
          : "Dispute submitted for review",
        dispute: updatedDispute,
        aiAnalysis: {
          decision: aiResolution.decision,
          confidence: aiResolution.confidence,
          reasoning: aiResolution.reasoning,
          suggestedAction: aiResolution.suggestedAction,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create dispute error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/disputes - Get disputes
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (transactionId) {
      where.transactionId = transactionId;
    }

    if (status) {
      where.decision = status.toUpperCase();
    }

    // Only show disputes for user's transactions
    where.transaction = {
      OR: [
        { buyerId: userId },
        { sellerId: userId },
      ],
    };

    const disputes = await prisma.dispute.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        transaction: {
          include: {
            item: true,
            buyer: {
              select: { id: true, name: true, photo: true },
            },
            seller: {
              select: { id: true, name: true, photo: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("Get disputes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
