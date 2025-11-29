import { NextRequest, NextResponse } from "next/server";
import { verifyIdSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { verifyStudentId } from "@/lib/ai/verification";
import { calculateTrustScore, getEarnedBadges } from "@/lib/services/trust-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = verifyIdSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { userId, idPhotoUrl } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.verificationStatus === "VERIFIED") {
      return NextResponse.json(
        { error: "User is already verified" },
        { status: 400 }
      );
    }

    // Update status to pending
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: "PENDING",
        studentIdPhoto: idPhotoUrl,
      },
    });

    // Run AI verification
    const verificationResult = await verifyStudentId(
      idPhotoUrl,
      user.email,
      user.name
    );

    // Update user based on verification result
    const newStatus = verificationResult.isValid ? "VERIFIED" : "REJECTED";
    const collegeFromVerification = verificationResult.college || user.college;

    // Calculate initial trust score
    const { score } = calculateTrustScore({
      verificationStatus: newStatus,
      avgRating: 0,
      completedDeals: 0,
      cancellationRate: 0,
    });

    // Get earned badges
    const badges = getEarnedBadges({
      completedDeals: 0,
      avgRating: 0,
      cancellationRate: 0,
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: newStatus,
        college: collegeFromVerification,
        trustScore: score,
        badges,
      },
      select: {
        id: true,
        name: true,
        email: true,
        college: true,
        verificationStatus: true,
        trustScore: true,
        badges: true,
      },
    });

    return NextResponse.json({
      message: verificationResult.isValid
        ? "Student ID verified successfully!"
        : "Verification failed. Please try again with a clearer photo.",
      verified: verificationResult.isValid,
      verificationDetails: {
        confidence: verificationResult.confidence,
        matchesEmail: verificationResult.matchesEmail,
        reason: verificationResult.reason,
      },
      user: updatedUser,
    });
  } catch (error) {
    console.error("ID verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
