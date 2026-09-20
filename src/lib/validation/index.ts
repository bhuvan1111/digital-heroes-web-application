import { z } from "zod";

export const scoreSchema = z.object({
  score: z
    .number({ invalid_type_error: "Score must be a number" })
    .int("Score must be an integer")
    .min(1, "Stableford score must be at least 1 point")
    .max(45, "Stableford score cannot exceed 45 points"),
  playedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must follow YYYY-MM-DD format")
    .refine((val) => {
      const parsed = new Date(val + "T00:00:00Z");
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return parsed <= today;
    }, "Played date cannot be in the future"),
  courseName: z.string().optional().nullable(),
  notes: z.string().max(300, "Notes cannot exceed 300 characters").optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  charityId: z.string().min(1, "Please select a preferred charity"),
  contributionPercentage: z
    .number()
    .int()
    .min(10, "Minimum charity contribution is 10%")
    .max(100, "Contribution cannot exceed 100%"),
});

export const charitySchema = z.object({
  name: z.string().min(2, "Charity name is required"),
  category: z.string().min(2, "Category is required"),
  location: z.string().min(2, "Location is required"),
  websiteUrl: z.string().url("Must be a valid website URL"),
  tagline: z.string().min(5, "Tagline must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  bannerUrl: z.string().url().optional().nullable(),
  isFeatured: z.boolean().default(false),
});

export const drawSchema = z.object({
  title: z.string().min(3, "Draw title is required"),
  drawDate: z.string().datetime("Must be a valid ISO datetime"),
  mode: z.enum(["RANDOM", "ALGORITHMIC"]),
  totalPrizePool: z.number().positive("Prize pool must be greater than 0"),
  jackpotRolloverIn: z.number().nonnegative().default(0),
});
