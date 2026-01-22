"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

// FETCH ALL USERS ACTION
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        currentStreak: true,
        phoneNumber: true, // Useful for manual communication
      },
    });
    return { success: true, data: users };
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return { success: false, error: "Failed to load users", data: [] };
  }
}

// RESET PASSWORD ACTION
export async function adminResetUserPassword(userId: string, newPassword: string) {
  try {
    if (!userId || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Admin Reset Error:", error);
    return { success: false, error: "Database update failed." };
  }
}