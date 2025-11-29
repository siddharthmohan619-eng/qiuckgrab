import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// UUID validation schema
const userIdSchema = z.string().uuid("Invalid user ID");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate user ID format
    const validationResult = userIdSchema.safeParse(id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        photo: true,
        college: true,
        verificationStatus: true,
        trustScore: true,
        badges: true,
        avgRating: true,
        completedDeals: true,
        cancellationRate: true,
        createdAt: true,
        // Include ratings received
        ratingsReceived: {
          select: {
            id: true,
            stars: true,
            comment: true,
            createdAt: true,
            fromUser: {
              select: {
                id: true,
                name: true,
                photo: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        // Include items listed by user
        items: {
          where: {
            availabilityStatus: "AVAILABLE",
          },
          select: {
            id: true,
            name: true,
            price: true,
            photo: true,
            condition: true,
            availabilityStatus: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return user with embedded ratings and items (no redundant top-level fields)
    return NextResponse.json({ user });
  } catch {
    console.error("Error fetching user profile");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
