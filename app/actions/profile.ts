"use server"

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function requestMentorStatus() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "You must be logged in." };
    }

    // 1. Check if an application already exists
    const existingApplication = await prisma.mentorApplication.findUnique({
      where: { userId },
    });

    if (existingApplication) {
      if (existingApplication.status === "PENDING") {
        return { success: false, error: "Application already pending review." };
      }
      if (existingApplication.status === "APPROVED") {
        return { success: false, error: "You are already a verified mentor." };
      }
    }

    // 2. Create the application
    // If they were previously REJECTED, we update it back to PENDING
    await prisma.mentorApplication.upsert({
      where: { userId },
      update: {
        status: "PENDING",
        createdAt: new Date(),
      },
      create: {
        userId,
        status: "PENDING",
      },
    });

    // 3. Optional: Update user role immediately to MENTOR 
    // (Since you mentioned all can be mentors, just unverified)
    await prisma.user.update({
      where: { id: userId },
      data: { role: "MENTOR" },
    });

    revalidatePath("/profile");
    return { success: true };

  } catch (error) {
    console.error("MENTOR_REQUEST_ERROR", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}