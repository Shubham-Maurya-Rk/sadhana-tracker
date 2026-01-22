"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { endOfMonth, startOfMonth } from "date-fns";

export async function getSocialData(searchQuery: string = "") {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Unauthorized" };

    try {
        const tracking = await prisma.connection.findMany({
            where: { receiverId: userId, status: "ACCEPTED" },
            include: { sender: true }
        });

        const trackedBy = await prisma.connection.findMany({
            where: { senderId: userId, status: "ACCEPTED" },
            include: { receiver: true }
        });

        const pending = await prisma.connection.findMany({
            where: { receiverId: userId, status: "PENDING" },
            include: { sender: true }
        });

        const exploreRaw = await prisma.user.findMany({
            where: {
                id: { not: userId },
                name: { contains: searchQuery },
            },
            select: {
                id: true,
                name: true,
                profileImage: true,
                currentStreak: true,
                templeName: true,
                isInitiated: true,
                // Check if I (the sender) have a connection with them
                followers: {
                    where: { senderId: userId },
                    select: { status: true }
                }
            },
            take: 15
        });

        return {
            tracking: tracking.map(c => c.sender),
            followers: trackedBy.map(c => c.receiver),
            pending: pending.map(c => ({ connectionId: c.id, user: c.sender })),
            explore: exploreRaw.map(u => ({
                ...u,
                // Flatten the connection status for easier UI handling
                myRequestStatus: u.followers[0]?.status || null
            }))
        };
    } catch (e) {
        return { error: "Failed to fetch" };
    }
}
export async function sendTrackRequest(targetUserId: string) {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Unauthorized" };

    await prisma.connection.create({
        data: { senderId: userId, receiverId: targetUserId, status: "PENDING" }
    });
    revalidatePath("/sangha");
    return { success: true };
}

export async function handleRequest(connectionId: string, status: "ACCEPTED" | "REJECTED") {
    if (status === "REJECTED") {
        await prisma.connection.delete({ where: { id: connectionId } });
    } else {
        await prisma.connection.update({ where: { id: connectionId }, data: { status: "ACCEPTED" } });
    }
    revalidatePath("/sangha");
    return { success: true };
}
// @/app/actions/sangha.ts
// @/app/actions/sangha.ts

export async function removeAuthority(targetUserId: string) {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await prisma.connection.deleteMany({
            where: {
                senderId: userId,
                receiverId: targetUserId,
                status: "ACCEPTED"
            }
        });
        revalidatePath("/friends");
        return { success: true, message: "Stopped tracking successfully" };
    } catch (err) {
        return { success: false, error: "Failed to stop tracking" };
    }
}

export async function stopTracking(trackerId: string) {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await prisma.connection.deleteMany({
            where: {
                senderId: trackerId,
                receiverId: userId,
                status: "ACCEPTED"
            }
        });
        revalidatePath("/friends");
        return { success: true, message: "Authority revoked successfully" };
    } catch (err) {
        return { success: false, error: "Failed to revoke authority" };
    }
}
export async function getDetailedSadhakaData(targetUserId: string, month: Date = new Date()) {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) throw new Error("Unauthorized");

    // 1. Check if I am the SENDER and the target is the RECEIVER
    // OR if I am looking at my own profile
    const isAuthorized = await prisma.connection.findFirst({
        where: {
            OR: [
                {
                    senderId: targetUserId,
                    receiverId: currentUserId,
                    status: "ACCEPTED"
                },
                {
                    id: currentUserId === targetUserId ? currentUserId : "NON_EXISTENT_ID"
                }
            ]
        }
    });

    if (!isAuthorized) {
        return { error: "You must be tracking this Sadhaka to view their detailed progress." };
    }

    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    try {
        const profile = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
                // Fetch current month logs for the calendar
                sadhanaLogs: {
                    where: {
                        date: { gte: monthStart, lte: monthEnd }
                    }
                },
                // Recently read 2 books
                bookProgressions: {
                    take: 2,
                    orderBy: { lastReadDate: 'desc' },
                    include: { book: true }
                },
                // Recently learned 10 shlokas across all challenges
                shlokaChallenges: {
                    include: {
                        shlokas: {
                            where: { status: 'LEARNED' },
                            orderBy: { updatedAt: 'desc' },
                            take: 10
                        }
                    }
                }
            }
        });

        // Flatten shlokas from all challenges and re-sort to get true "last 10"
        const recentShlokas = profile?.shlokaChallenges
            .flatMap(c => c.shlokas.map(s => ({ ...s, challengeTitle: c.title })))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 10);

        return {
            success: true,
            data: { ...profile, recentShlokas }
        };
    } catch (error) {
        return { error: "Failed to fetch spiritual data" };
    }
}