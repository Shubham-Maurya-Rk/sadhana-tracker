import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { startOfDay, subDays, format } from "date-fns";

export async function POST(req: Request) {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            date,
            chantingRounds,
            lectureDuration,
            mangalAarti,
            darshanAarti,
            bhogaAarti,
            gauraAarti,
            wakeUpTime,
            sleepTime
        } = body;

        // 1. Normalize the primary date to UTC Midnight for database consistency
        const logDate = startOfDay(new Date(date));
        const yesterday = subDays(logDate, 1);

        const result = await prisma.$transaction(async (tx) => {
            // 2. Upsert the Sadhana Log
            const log = await tx.sadhanaLog.upsert({
                where: {
                    // This assumes you have a @@unique([userId, date]) in your schema
                    userId_date: { userId, date: logDate },
                },
                update: {
                    chantingRounds,
                    lectureDuration,
                    mangalAarti,
                    darshanAarti,
                    bhogaAarti,
                    gauraAarti,
                    wakeUpTime: wakeUpTime ? new Date(wakeUpTime) : null,
                    sleepTime: sleepTime ? new Date(sleepTime) : null,
                },
                create: {
                    userId,
                    date: logDate,
                    chantingRounds,
                    lectureDuration,
                    mangalAarti,
                    darshanAarti,
                    bhogaAarti,
                    gauraAarti,
                    wakeUpTime: wakeUpTime ? new Date(wakeUpTime) : null,
                    sleepTime: sleepTime ? new Date(sleepTime) : null,
                },
            });

            // 3. Update User Streaks
            // Check if a log exists for yesterday to continue the streak
            const yesterdayLog = await tx.sadhanaLog.findFirst({
                where: { userId, date: yesterday },
            });

            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { currentStreak: true, highestStreak: true }
            });

            if (user) {
                let newStreak = yesterdayLog ? user.currentStreak + 1 : 1;

                // If they are logging a past date, we don't necessarily want to 
                // overwrite a higher current streak unless it's for "today"
                const isToday = format(logDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                await tx.user.update({
                    where: { id: userId },
                    data: {
                        currentStreak: isToday ? newStreak : undefined,
                        highestStreak: Math.max(newStreak, user.highestStreak),
                    },
                });
            }

            return log;
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error("[SADHANA_POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}