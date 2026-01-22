"use server";

import { prisma as db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { InspirationCategory, InspirationType } from "@/generated/prisma/client";

/**
 * UNIFIED FETCH: Handles both Shlokas and Motivations
 * Optimized with Case-Insensitive search on both Text and Reference
 */
export async function getInspirations(category: InspirationCategory, query?: string, type?: string) {
    try {
        const data = await db.dailyInspiration.findMany({
            where: {
                category: category,
                AND: [
                    query
                        ? {
                            OR: [
                                { text: { contains: query, mode: 'insensitive' } },
                                { reference: { contains: query, mode: 'insensitive' } }
                            ]
                        }
                        : {},
                    type && type !== "ALL" ? { type: type as InspirationType } : {},
                ]
            },
            orderBy: { createdAt: "desc" },
        });
        return { data, error: null };
    } catch (error) {
        console.error(`Fetch error for ${category}:`, error);
        return { data: null, error: "Failed to fetch data" };
    }
}

/**
 * UNIFIED CREATE: Handles both Shlokas and Motivations
 */
export async function createInspiration(category: InspirationCategory, formData: any) {
    try {
        await db.dailyInspiration.create({
            data: {
                text: formData.text,
                author: formData.author || "Srila Prabhupada",
                reference: formData.reference,
                category: category,
                type: formData.type as InspirationType,
                sourceLink: formData.sourceLink || null,
            },
        });

        // Revalidate based on the category path
        const path = category === "MOTIVATION" ? "/admin/motivations" : "/admin/shlokas";
        revalidatePath(path);

        return { success: true };
    } catch (error) {
        console.error("Create Error:", error);
        return { success: false, error: `Failed to add ${category.toLowerCase()}` };
    }
}

/**
 * DAILY ROTATION: Uses Modulo for infinite cycling
 */
/**
 * Fetches the daily item for a specific category AND type
 */
export async function getDailyItemByType(category: InspirationCategory, type: InspirationType) {
    try {
        const totalCount = await db.dailyInspiration.count({
            where: { category, type }
        });

        if (totalCount === 0) return null;

        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const skipIndex = dayOfYear % totalCount;

        return await db.dailyInspiration.findFirst({
            where: { category, type },
            skip: skipIndex,
            orderBy: { createdAt: 'asc' }
        });
    } catch (e) {
        return null;
    }
}

/**
 * DELETE: Unified for both types
 */
export async function deleteInspiration(id: string, category: InspirationCategory) {
    try {
        await db.dailyInspiration.delete({ where: { id } });

        const path = category === "MOTIVATION" ? "/admin/motivations" : "/admin/shlokas";
        revalidatePath(path);

        return { success: true };
    } catch (error) {
        return { success: false, error: "Delete failed" };
    }
}