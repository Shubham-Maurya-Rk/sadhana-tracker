"use server"

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Action to Request Formal Mentorship (Tracking)
export async function sendMentorshipRequest(mentorId: string) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Unauthorized");

    try {
        await prisma.mentorshipRequest.create({
            data: {
                senderId: userId,
                receiverId: mentorId,
                status: "PENDING",
            },
        });
        revalidatePath("/mentors");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Request already exists or failed." };
    }
}

// Action to Follow for Daily Learnings (Social Connection)
export async function followUser(targetUserId: string) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Unauthorized");

    try {
        await prisma.connection.create({
            data: {
                senderId: userId,
                receiverId: targetUserId,
            },
        });
        revalidatePath("/mentors");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Already following." };
    }
}

export async function getMentors(query: string = "") {
    const currentUserId = await getCurrentUserId();

    return await prisma.user.findMany({
        where: {
            role: "MENTOR",
            id: { not: currentUserId ?? "" },
            OR: [
                { name: { contains: query } },
                { templeName: { contains: query } },
                { id: { equals: query } }
            ],
        },
        include: {
            mentorApplication: true,
            followers: {
                where: { senderId: currentUserId ?? "" }
            },
            receivedMentorshipRequests: {
                where: { senderId: currentUserId ?? "" }
            },
        },
        orderBy: {
            name: 'asc'
        }
    });
}

// @/app/actions/mentorship.ts
export async function removeMentor(mentorId: string) {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Delete the Mentorship Request link
            // We use deleteMany because the unique constraint is on [sender, receiver]
            await tx.mentorshipRequest.deleteMany({
                where: {
                    senderId: userId,    // The Sadhaka
                    receiverId: mentorId, // The Mentor
                    status: "ACCEPTED"
                }
            });

            // 2. Remove the Sadhaka from any Group belonging to this Mentor
            // We find groups where mentorId matches and remove the user from GroupMember
            await tx.groupMember.deleteMany({
                where: {
                    userId: userId,
                    group: {
                        mentorId: mentorId
                    }
                }
            });
        });

        revalidatePath("/mentors");
        // Also revalidate group management if the mentor is looking at it
        revalidatePath("/mentor/groups");

        return { success: true, message: "Mentorship and Group associations removed." };
    } catch (error) {
        console.error("Remove Mentor Error:", error);
        return { success: false, error: "Failed to disconnect from mentor." };
    }
}


export async function getPendingApplications() {
    try {
        const applications = await prisma.mentorApplication.findMany({
            where: { status: "PENDING" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true,
                        templeName: true,
                        isInitiated: true,
                        currentStreak: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return { data: applications, error: null };
    } catch (error) {
        return { data: null, error: "Failed to fetch applications" };
    }
}

export async function updateMentorStatus(userId: string, applicationId: string, newStatus: "APPROVED" | "REJECTED") {
    try {
        // We use a transaction to ensure both updates succeed or both fail
        await prisma.$transaction(async (tx) => {
            // 1. Update Application Status
            await tx.mentorApplication.update({
                where: { id: applicationId },
                data: { status: newStatus },
            });

            // 2. If Approved, Upgrade User Role
            if (newStatus === "APPROVED") {
                await tx.user.update({
                    where: { id: userId },
                    data: { role: "MENTOR" }, // Ensure your Role enum has MENTOR
                });
            }
        });

        revalidatePath("/admin/verify-mentors");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Update failed" };
    }
}