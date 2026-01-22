"use server"

import { prisma as db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ShlokaStatus } from "@/generated/prisma/client"
import { getCurrentUserId } from "@/lib/auth" // Imported as requested

/** --- CHALLENGE ACTIONS --- **/
export async function getChallenges() {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        return await db.shlokaChallenge.findMany({
            where: { userId },
            include: { shlokas: true },
            orderBy: { lastActivity: 'desc' }
        });
    } catch (error) {
        return [];
    }
}

export async function createChallenge(title: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        const challenge = await db.shlokaChallenge.create({
            data: {
                title,
                userId, // userId is now pulled from the auth session
                currentStreak: 0,
                highestStreak: 0
            },
        })
        revalidatePath("/challenges")
        return { success: true, data: challenge }
    } catch (error) {
        console.error("CREATE_CHALLENGE_ERROR", error);
        return { success: false, error: "Failed to create challenge" }
    }
}

export async function deleteChallenge(id: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error("Unauthorized");

        // We verify the user owns this challenge before deleting
        await db.shlokaChallenge.delete({
            where: { id, userId }
        })
        revalidatePath("/challenges")
        return { success: true };
    } catch (error) {
        return { success: false, error: "Deletion failed" };
    }
}

/** --- SHLOKA ACTIONS --- **/

export async function addShloka(challengeId: string, reference: string, content: string, translation: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        // Verify challenge belongs to user before adding shloka
        const challenge = await db.shlokaChallenge.findUnique({
            where: { id: challengeId, userId }
        });

        if (!challenge) return { success: false, error: "Challenge not found" };

        const shloka = await db.shloka.create({
            data: { challengeId, reference, content, translation, status: "NOT_STARTED" },
        })

        // Update last activity on the challenge
        await db.shlokaChallenge.update({
            where: { id: challengeId },
            data: { lastActivity: new Date() }
        })

        revalidatePath("/challenges")
        return { success: true, data: shloka }
    } catch (error) {
        return { success: false, error: "Failed to add shloka" }
    }
}

export async function updateShlokaStatus(shlokaId: string, status: ShlokaStatus) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        const shloka = await db.shloka.findUnique({
            where: { id: shlokaId },
            include: { challenge: true }
        });

        if (!shloka || !shloka.challenge || shloka.challenge.userId !== userId) {
            return { success: false, error: "Not found" };
        }

        const challenge = shloka.challenge;
        const today = new Date();
        const lastActivity = challenge.lastActivity ? new Date(challenge.lastActivity) : null;

        // Ensure we start with at least 0
        let currentStreakValue = challenge.currentStreak ?? 0;
        let newStreak = currentStreakValue;

        // Force uppercase check to be safe with Enums
        if (String(status).toUpperCase() === "LEARNED") {
            if (!lastActivity) {
                newStreak = 1;
            } else {
                const todayStr = today.toDateString();
                const lastActivityStr = lastActivity.toDateString();

                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();

                if (lastActivityStr === yesterdayStr) {
                    newStreak = currentStreakValue + 1;
                } else if (lastActivityStr === todayStr) {
                    // Already active today? Keep the streak as is, 
                    // but ensure it's at least 1 if it was somehow 0
                    newStreak = currentStreakValue || 1;
                } else {
                    // Gap found (more than 24h)
                    newStreak = 1;
                }
            }
        }

        const newHighestStreak = Math.max(newStreak, challenge.highestStreak ?? 0);

        await db.$transaction([
            db.shloka.update({
                where: { id: shlokaId },
                data: { status }
            }),
            db.shlokaChallenge.update({
                where: { id: challenge.id },
                data: {
                    currentStreak: newStreak,
                    highestStreak: newHighestStreak,
                    lastActivity: new Date()
                }
            })
        ]);

        revalidatePath("/challenges");
        return { success: true };
    } catch (error) {
        console.error("Streak Update Error:", error);
        return { success: false };
    }
}

export async function deleteShloka(id: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return;

        await db.shloka.delete({
            where: {
                id,
                challenge: { userId }
            }
        })
        revalidatePath("/challenges")
    } catch (error) {
        console.error("DELETE_SHLOKA_ERROR", error);
    }
}