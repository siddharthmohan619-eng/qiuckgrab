import { NextRequest, NextResponse } from "next/server";
import { createItemSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { checkItemPrice } from "@/lib/ai/price-checker";
import { getUserFromRequest } from "@/lib/auth";


// Helper to get user from token


// POST /api/items - Create a new item listing
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
    const validationResult = createItemSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, category, description, price, condition, photo, photos } = validationResult.data;

    // Check price fairness
    const priceCheck = await checkItemPrice(name, price, condition);

    // Create item
    const item = await prisma.item.create({
      data: {
        sellerId: userId,
        name,
        category,
        description: description || null,
        price,
        condition,
        photo: photo || null,
        photos: photos || [],
        aiPriceRating: priceCheck.rating,
        avgCampusPrice: priceCheck.averagePrice,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            photo: true,
            verificationStatus: true,
            trustScore: true,
            avgRating: true,
            badges: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Item listed successfully",
        item,
        priceAnalysis: {
          rating: priceCheck.rating,
          averagePrice: priceCheck.averagePrice,
          explanation: priceCheck.explanation,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/items - Get all items (paginated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const sellerId = searchParams.get("sellerId");

    const where: Record<string, unknown> = {
      availabilityStatus: "AVAILABLE",
    };

    if (category) {
      where.category = category;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              photo: true,
              verificationStatus: true,
              trustScore: true,
              avgRating: true,
              badges: true,
              isOnline: true,
            },
          },
        },
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
