import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { generateOTP } from "@/lib/ai/verification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password, college } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        college: college || null,
        emailVerificationOtp: otp,
        otpExpiresAt,
        verificationStatus: "UNVERIFIED",
      },
      select: {
        id: true,
        name: true,
        email: true,
        college: true,
        verificationStatus: true,
        createdAt: true,
      },
    });

    // In production, send OTP via email
    // For MVP, we'll return it (or log it)
    console.log(`Email verification OTP for ${email}: ${otp}`);

    return NextResponse.json(
      {
        message: "User registered successfully. Please verify your email.",
        user,
        // Only include OTP in development
        ...(process.env.NODE_ENV === "development" && { otp }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
