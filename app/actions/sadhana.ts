"use server"

import { prisma as db } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { endOfMonth, startOfMonth } from "date-fns";

interface SadhanaFormValues {
    date: Date;
    chantingRounds: number;
    lectureDuration: number;
    mangalAarti: boolean;
    darshanAarti: boolean;
    bhogaAarti: boolean;
    gauraAarti: boolean;
    wakeUpTime: Date | null;
    sleepTime: Date | null;
    missedNote: string;
}
export async function upsertSadhanaAction(data: SadhanaFormValues) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: "Unauthorized. Please log in." };
        }

        // 1. Normalize the Date to UTC Midnight
        const d = new Date(data.date);
        const normalizedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        // 2. Upsert the Sadhana Log
        const log = await db.sadhanaLog.upsert({
            where: {
                userId_date: {
                    userId: userId,
                    date: normalizedDate,
                },
            },
            update: {
                chantingRounds: data.chantingRounds,
                lectureDuration: data.lectureDuration,
                mangalAarti: data.mangalAarti,
                darshanAarti: data.darshanAarti,
                bhogaAarti: data.bhogaAarti,
                gauraAarti: data.gauraAarti,
                wakeUpTime: data.wakeUpTime,
                sleepTime: data.sleepTime,
                missedNote: data.missedNote ?? null,
            },
            create: {
                userId: userId,
                date: normalizedDate,
                chantingRounds: data.chantingRounds,
                lectureDuration: data.lectureDuration,
                mangalAarti: data.mangalAarti,
                darshanAarti: data.darshanAarti,
                bhogaAarti: data.bhogaAarti,
                gauraAarti: data.gauraAarti,
                wakeUpTime: data.wakeUpTime,
                sleepTime: data.sleepTime,
                missedNote: data.missedNote ?? null,
            },
        });

        // 3. STREAK LOGIC using lastSadhanaDate
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                currentStreak: true,
                highestStreak: true,
                roundsGoal: true,
                lastSadhanaDate: true
            }
        });

        if (user) {
            const lastDate = user.lastSadhanaDate ? new Date(user.lastSadhanaDate) : null;

            // Check if this is a NEW day for the streak (lastSadhanaDate is before normalizedDate)
            const isNewDayForStreak = !lastDate || lastDate.getTime() < normalizedDate.getTime();

            if (isNewDayForStreak) {
                const newStreak = user.currentStreak + 1;
                const newHighest = Math.max(newStreak, user.highestStreak);

                await db.user.update({
                    where: { id: userId },
                    data: {
                        currentStreak: newStreak,
                        highestStreak: newHighest,
                        lastSadhanaDate: normalizedDate, // Mark this day as completed
                    },
                });
            }
        }

        revalidatePath("/sadhak");
        return { success: true, data: log };
    } catch (error) {
        console.error("SadhanaLog Error:", error);
        return { success: false, error: "Failed to sync sadhana data." };
    }
}

export async function getDailySadhanaAction(date: Date) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        // 1. Create a copy of the incoming date
        const d = new Date(date);

        // 2. Adjust for the timezone offset manually
        // This converts Dec 16 18:30 UTC back into Dec 17 00:00 UTC
        const normalizedDate = new Date(
            d.getTime() - d.getTimezoneOffset() * 60000
        );

        // 3. Strip the time so it is 00:00:00
        normalizedDate.setUTCHours(0, 0, 0, 0);
        // Fetch both the log and the user goals in one go
        const [log, user] = await Promise.all([
            db.sadhanaLog.findUnique({
                where: { userId_date: { userId, date: normalizedDate } }
            }),
            db.user.findUnique({
                where: { id: userId },
                select: { roundsGoal: true }
            })
        ]);

        return {
            success: true,
            data: log,
            roundsGoal: user?.roundsGoal ?? 16
        };
    } catch (error) {
        return { success: false, error: "Failed to fetch data" };
    }
}

export async function getMonthlySadhanaAction(month: Date) {
    try {
        const userId = await getCurrentUserId();

        // 1. Auth Guard
        if (!userId) {
            console.error("[GET_MONTHLY_SADHANA] No user ID found in session");
            return null;
        }

        // 2. Parallel Data Fetching
        const [logs, user] = await Promise.all([
            db.sadhanaLog.findMany({
                where: {
                    userId: userId,
                    date: {
                        gte: startOfMonth(month),
                        lte: endOfMonth(month),
                    },
                },
                select: {
                    date: true,
                    chantingRounds: true,
                    lectureDuration: true,
                    totalRead: true,
                    missedNote: true,
                    mangalAarti: true,
                    darshanAarti: true,
                    sleepTime: true,
                    wakeUpTime: true,
                    bhogaAarti: true,
                    gauraAarti: true,
                },
            }),
            db.user.findUnique({
                where: { id: userId },
                select: {
                    roundsGoal: true,
                    readingGoal: true,
                    hearingGoal: true,
                    currentStreak: true,
                    highestStreak: true,
                },
            }),
        ]);

        // 3. User Record Guard
        if (!user) {
            console.warn(`[GET_MONTHLY_SADHANA] User record not found for ID: ${userId}`);
            // Return null or throw a specific error based on your app's flow
            return null;
        }

        // 4. Successful Return
        return {
            logs: logs ?? [],
            user: {
                currentStreak: user.currentStreak ?? 0,
                highestStreak: user.highestStreak ?? 0,
            },
            goals: {
                roundsGoal: user.roundsGoal ?? 16,
                readingGoal: user.readingGoal ?? 30,
                hearingGoal: user.hearingGoal ?? 30,
            }
        };

    } catch (error) {
        // 5. Global Catch Block
        console.error("[GET_MONTHLY_SADHANA_ERROR]", error);

        // Throwing the error allows your Next.js error.tsx boundary 
        // to catch it and show a fallback UI to the user
        throw new Error("Unable to fetch your spiritual progress. Please try again later.");
    }
}