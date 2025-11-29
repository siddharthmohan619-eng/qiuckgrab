/**
 * Seed data for QuickGrab demo environment
 * Run with: npx ts-node prisma/seed/index.ts
 */

import { PrismaClient, VerificationStatus, ItemCondition, AvailabilityStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo users
  const password = await hash("demo123456", 12);

  const seller1 = await prisma.user.upsert({
    where: { email: "jane@university.edu" },
    update: {},
    create: {
      name: "Jane Smith",
      email: "jane@university.edu",
      password,
      college: "State University",
      verificationStatus: VerificationStatus.VERIFIED,
      emailVerified: true,
      trustScore: 85,
      badges: ["🏆 Trusted Seller", "⚡ Quick Responder", "💎 Fair Pricer"],
      avgRating: 4.8,
      completedDeals: 47,
      cancellationRate: 0.02,
      isOnline: true,
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: "mike@college.edu" },
    update: {},
    create: {
      name: "Mike Johnson",
      email: "mike@college.edu",
      password,
      college: "Tech Institute",
      verificationStatus: VerificationStatus.VERIFIED,
      emailVerified: true,
      trustScore: 65,
      badges: ["⚡ Quick Responder"],
      avgRating: 4.5,
      completedDeals: 23,
      cancellationRate: 0.05,
      isOnline: false,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "john@university.edu" },
    update: {},
    create: {
      name: "John Doe",
      email: "john@university.edu",
      password,
      college: "State University",
      verificationStatus: VerificationStatus.VERIFIED,
      emailVerified: true,
      trustScore: 45,
      badges: [],
      avgRating: 4.2,
      completedDeals: 8,
      cancellationRate: 0,
      isOnline: true,
    },
  });

  console.log("✅ Users created");

  // Create demo items
  const items = [
    {
      sellerId: seller1.id,
      name: "iPhone 13 Charger (20W)",
      category: "Electronics",
      description: "Brand new Apple 20W USB-C charger. Never opened.",
      price: 25.0,
      condition: ItemCondition.NEW,
      aiPriceRating: "Fair",
      avgCampusPrice: 28.0,
    },
    {
      sellerId: seller1.id,
      name: "Calculus: Early Transcendentals",
      category: "Books",
      description: "Stewart 8th Edition. Some highlighting but all pages intact.",
      price: 45.0,
      condition: ItemCondition.GOOD,
      aiPriceRating: "Great Deal",
      avgCampusPrice: 60.0,
    },
    {
      sellerId: seller1.id,
      name: "TI-84 Plus CE Calculator",
      category: "Electronics",
      description: "Works perfectly. Includes cable and cover.",
      price: 80.0,
      condition: ItemCondition.LIKE_NEW,
      aiPriceRating: "Fair",
      avgCampusPrice: 85.0,
    },
    {
      sellerId: seller2.id,
      name: "Desk Lamp (LED)",
      category: "Furniture",
      description: "Adjustable brightness, USB charging port.",
      price: 22.0,
      condition: ItemCondition.GOOD,
      aiPriceRating: "Underpriced",
      avgCampusPrice: 30.0,
    },
    {
      sellerId: seller2.id,
      name: "Wireless Earbuds",
      category: "Electronics",
      description: "Generic brand but great sound. Battery lasts 5 hours.",
      price: 18.0,
      condition: ItemCondition.GOOD,
      aiPriceRating: "Fair",
      avgCampusPrice: 20.0,
    },
    {
      sellerId: seller2.id,
      name: "College Backpack",
      category: "Accessories",
      description: "Laptop compartment, lots of pockets. Some wear.",
      price: 25.0,
      condition: ItemCondition.FAIR,
      aiPriceRating: "Fair",
      avgCampusPrice: 28.0,
    },
  ];

  for (const itemData of items) {
    await prisma.item.create({
      data: {
        ...itemData,
        availabilityStatus: AvailabilityStatus.AVAILABLE,
      },
    });
  }

  console.log("✅ Items created");

  // Create demo ratings
  const ratings = [
    {
      userId: seller1.id,
      fromUserId: buyer.id,
      stars: 5,
      comment: "Great seller! Fast response and item was exactly as described.",
    },
    {
      userId: seller2.id,
      fromUserId: buyer.id,
      stars: 4,
      comment: "Good experience overall. Item was in good condition.",
    },
  ];

  for (const ratingData of ratings) {
    await prisma.rating.create({
      data: ratingData,
    });
  }

  console.log("✅ Ratings created");
  console.log("🎉 Seed completed!");

  console.log("\n📋 Demo Credentials:");
  console.log("Email: john@university.edu");
  console.log("Email: jane@university.edu");
  console.log("Email: mike@college.edu");
  console.log("Password (all): demo123456");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
