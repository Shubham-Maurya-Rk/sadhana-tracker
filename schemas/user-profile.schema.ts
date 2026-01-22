import { z } from "zod";

export const userProfileSchema = z.object({
    name: z.string().min(2, "Name is required"),

    phoneNumber: z
        .union([
            z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
            z.literal(""),
            z.null(),
            z.undefined(),
        ])
        .transform((val) => (val === "" ? null : val)),

    dateOfBirth: z
        .union([z.string(), z.literal(""), z.null(), z.undefined()])
        .transform((val) => (val === "" ? null : val)),

    templeName: z.string().nullable().optional(),

    bhaktiStartDate: z
        .union([z.string(), z.literal(""), z.null(), z.undefined()])
        .transform((val) => (val === "" ? null : val)),

    isInitiated: z.boolean(),

    roundsGoal: z.number().min(1),
    // New Goal Validations
    hearingGoal: z
        .number()
        .min(0, "Goal cannot be negative")
        .max(1440, "Maximum 24 hours"), // 1440 mins = 24h

    readingGoal: z
        .number()
        .min(0, "Goal cannot be negative")
        .max(1000, "Goal is too high"),

    aartisGoal: z
        .number()
        .min(0, "Goal cannot be negative")
        .max(4, "Maximum 10 aartis per day"),
});

export type UserProfileForm = z.infer<typeof userProfileSchema>;
