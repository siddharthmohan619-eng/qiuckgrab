import { z } from "zod";

// Auth validators
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  college: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const verifyIdSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  idPhotoUrl: z.string().url("Invalid photo URL"),
});

// Item validators
export const createItemSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"]).default("GOOD"),
  photo: z.string().url().optional(),
  photos: z.array(z.string().url()).optional(),
});

export const updateItemSchema = createItemSchema.partial();

// Transaction validators
export const requestTransactionSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  buyerId: z.string().uuid("Invalid buyer ID"),
});

export const acceptTransactionSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
});

export const payTransactionSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  paymentId: z.string().min(1, "Payment ID is required"),
});

export const confirmTransactionSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
});

export const refundTransactionSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  reason: z.string().optional(),
});

// Rating validators
export const createRatingSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  transactionId: z.string().uuid("Invalid transaction ID"),
  stars: z.number().int().min(1).max(5, "Rating must be between 1-5"),
  comment: z.string().max(500).optional(),
});

// Dispute validators
export const createDisputeSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  evidenceText: z.string().min(10, "Please provide more details"),
  photos: z.array(z.string().url()).optional(),
});

// Search validators
export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"]).optional(),
  sort: z.enum(["price_asc", "price_desc", "distance", "rating", "newest"]).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

// Message validators
export const sendMessageSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  content: z.string().min(1).max(1000, "Message too long"),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type VerifyIdInput = z.infer<typeof verifyIdSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type RequestTransactionInput = z.infer<typeof requestTransactionSchema>;
export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
