import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // 1. Security Guard: Only allow this to run in development mode
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Forbidden: Dev Only', { status: 403 });
  }

  try {
    // We define "Today" as 00:00:00. 
    // If their last activity is LESS than this, it means they didn't do anything today.
    // If it's LESS than (Today - 24h), it means they missed yesterday entirely.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // --- 1. RESET OVERALL USER SADHANA STREAKS ---
    const userUpdate = await prisma.user.updateMany({
      where: {
        lastSadhanaDate: { lt: yesterdayStart },
        currentStreak: { gt: 0 },
      },
      data: { currentStreak: 0 },
    });

    // --- 2. RESET BOOK READING STREAKS ---
    const bookUpdate = await prisma.userBookProgress.updateMany({
      where: {
        lastReadDate: { lt: yesterdayStart },
        currentStreak: { gt: 0 },
      },
      data: { currentStreak: 0 },
    });

    // --- 3. RESET SHLOKA CHALLENGE STREAKS ---
    const shlokaUpdate = await prisma.shlokaChallenge.updateMany({
      where: {
        lastActivity: { lt: yesterdayStart },
        currentStreak: { gt: 0 },
      },
      data: { currentStreak: 0 },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        usersReset: userUpdate.count,
        booksReset: bookUpdate.count,
        shlokasReset: shlokaUpdate.count,
      },
      message: "Streaks reset for all activities missed yesterday."
    });
  } catch (error: any) {
    console.error("Streak Reset Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}