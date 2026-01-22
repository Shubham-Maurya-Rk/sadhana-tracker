import { z } from "zod";

export const CreateGroupSchema = z.object({
    name: z.string()
        .min(3, "Group name must be at least 3 characters")
        .max(50, "Group name must be under 50 characters"),
});

export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;