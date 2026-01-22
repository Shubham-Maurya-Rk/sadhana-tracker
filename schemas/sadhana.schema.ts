import { z } from "zod";

export const sadhanaSchema = z.object({
    date: z.date(),
    // Use .coerce.number() without optional or preprocess for the cleanest inference
    rounds: z.coerce.number({ invalid_type_error: "Rounds must be a number" }).min(0).max(108),
    lecture: z.coerce.number({ invalid_type_error: "Minutes must be a number" }).min(0),

    // Strict booleans (no optional/undefined)
    mangal: z.boolean(),
    darshan: z.boolean(),
    bhoga: z.boolean(),
    gaura: z.boolean(),

    // Strict strings
    wakeup: z.string(),
    sleep: z.string(),
    missedNote: z.string(),
});

// This type will now have: rounds: number; lecture: number;
export type SadhanaFormValues = z.infer<typeof sadhanaSchema>;