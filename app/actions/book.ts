"use server"

import { prisma as db } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
// Instead of: import { ProgressType } from "@prisma/client";
import { ProgressType } from "@/generated/prisma/client";

/**
 * Fetches Global Catalog and User Shelf
 */
export async function getLibraryData() {
    const userId = await getCurrentUserId();

    const globalBooks = await db.book.findMany({
        where: { userId: null },
        orderBy: { title: 'asc' }
    });

    const userShelf = userId ? await db.userBookProgress.findMany({
        where: { userId },
        include: { book: true }
    }) : [];

    return {
        globalBooks: globalBooks.map(gb => ({
            id: gb.id,
            title: gb.title,
            author: gb.author || "Srila Prabhupada",
            isAdded: userShelf.some(us => us.bookId === gb.id)
        })),
        userShelf: userShelf.map(item => ({
            id: item.id, // Progress ID
            bookId: item.bookId,
            title: item.book.title,
            author: item.book.author || "Srila Prabhupada",
            total: item.totalUnits,
            current: item.currentValue,
            currentStreak: item.currentStreak,
            highestStreak: item.highestStreak,
            type: item.type,
            lastReadDate: item.lastReadDate?.toISOString() || null,
        }))
    };
}

/**
 * Adds a book to shelf with generic totalUnits and type
 */
export async function addToShelfAction(payload: {
    bookId: string,
    totalUnits: number,
    type: ProgressType
}) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { error: "You must be logged in to add books." };
        }

        const newProgress = await db.userBookProgress.create({
            data: {
                userId,
                bookId: payload.bookId,
                totalUnits: payload.totalUnits,
                type: payload.type,
                currentValue: 0,
                currentStreak: 0,
                highestStreak: 0,
            },
            include: { book: true }
        });

        revalidatePath("/");

        return {
            data: {
                id: newProgress.id,
                bookId: newProgress.bookId,
                title: newProgress.book.title,
                author: newProgress.book.author,
                total: newProgress.totalUnits,
                current: newProgress.currentValue,
                currentStreak: newProgress.currentStreak,
                highestStreak: newProgress.highestStreak,
                type: newProgress.type,
                lastReadDate: null
            }
        };

    } catch (error: any) {
        console.error("ADD_TO_SHELF_ERROR:", error);

        // Handle Prisma Unique Constraint Error (P2002)
        if (error.code === 'P2002') {
            return { error: "This book is already on your shelf." };
        }

        return { error: "Failed to add book. Please try again later." };
    }
}

/**
 * Logic: Increments streak on new day, resets if day missed.
 */
export async function updateProgressAction(progressId: string, delta: number) {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const current = await db.userBookProgress.findUnique({
        where: { id: progressId }
    });

    if (!current) return;

    const now = new Date();
    const today = new Date().toDateString();
    const lastRead = current.lastReadDate ? new Date(current.lastReadDate).toDateString() : null;

    let newStreak = current.currentStreak;
    let newHighest = current.highestStreak;

    // 1. Only calculate streak if they are adding progress (delta > 0)
    if (delta > 0) {
        if (!lastRead) {
            newStreak = 1;
        } else if (lastRead !== today) {
            const hoursSinceLastRead = (now.getTime() - new Date(current.lastReadDate!).getTime()) / (1000 * 60 * 60);

            if (hoursSinceLastRead > 48) {
                newStreak = 1; // Reset if more than a day missed
            } else {
                newStreak += 1; // Consecutive day
            }
        }

        if (newStreak > newHighest) newHighest = newStreak;
    }

    const nextValue = Math.min(current.totalUnits, Math.max(0, current.currentValue + delta));

    await db.userBookProgress.update({
        where: { id: progressId },
        data: {
            currentValue: nextValue,
            lastReadDate: delta > 0 ? now : current.lastReadDate,
            currentStreak: newStreak,
            highestStreak: newHighest,
            isCompleted: nextValue >= current.totalUnits
        }
    });

    revalidatePath("/");
}

export async function deleteFromShelfAction(progressId: string) {
    const userId = await getCurrentUserId();
    if (!userId) return;

    await db.userBookProgress.delete({
        where: { id: progressId }
    });

    revalidatePath("/");
}


export async function addPrivateBookAction(values: {
    title: string;
    author?: string;
    totalUnits: number;
    type: ProgressType;
}) {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Unauthorized" };

    try {
        const result = await db.$transaction(async (tx) => {
            // 1. Create the Book (Private)
            const book = await tx.book.create({
                data: {
                    title: values.title,
                    author: values.author || "Unknown Author",
                    userId: userId,
                },
            });

            // 2. Create the Progress entry
            const progress = await tx.userBookProgress.create({
                data: {
                    userId: userId,
                    bookId: book.id,
                    type: values.type,
                    totalUnits: values.totalUnits,
                    currentValue: 0,
                    currentStreak: 0,
                    highestStreak: 0,
                },
                include: { book: true },
            });

            return progress;
        });

        revalidatePath("/");

        // Return formatted data identical to addToShelfAction
        return {
            data: {
                id: result.id,
                bookId: result.bookId,
                title: result.book.title,
                author: result.book.author,
                total: result.totalUnits,
                current: result.currentValue,
                currentStreak: result.currentStreak,
                highestStreak: result.highestStreak,
                type: result.type,
                lastReadDate: null,
                isPrivate: true // Useful flag for UI logic
            }
        };
    } catch (error) {
        console.error("PRIVATE_BOOK_ERROR:", error);
        return { error: "Failed to create private book." };
    }
}


export async function updateBookProgressAction(progressId: string, delta: number) {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Unauthorized" };

    // UTC Midnight for daily log consistency
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    try {
        const result = await db.$transaction(async (tx) => {
            const current = await tx.userBookProgress.findUnique({
                where: { id: progressId },
            });

            if (!current) throw new Error("Record not found");

            const now = new Date();
            const lastRead = current.lastReadDate;

            let newStreak = current.currentStreak;
            let newHighest = current.highestStreak;

            // Streak logic: Check if first activity of the day
            const isFirstReadToday = !lastRead ||
                lastRead.getUTCDate() !== now.getUTCDate() ||
                lastRead.getUTCMonth() !== now.getUTCMonth();

            if (delta > 0 && isFirstReadToday) {
                newStreak += 1;
                if (newStreak > newHighest) newHighest = newStreak;
            }

            // 1. Update individual book progress
            const updated = await tx.userBookProgress.update({
                where: { id: progressId },
                data: {
                    currentValue: {
                        // Ensure we don't go below 0 at DB level
                        increment: (current.currentValue + delta) < 0 ? -current.currentValue : delta
                    },
                    currentStreak: newStreak,
                    highestStreak: newHighest,
                    lastReadDate: now,
                    isCompleted: (current.currentValue + delta) >= current.totalUnits
                }
            });

            // 2. Update Daily SadhanaLog aggregate
            // This tracks total pages read across ALL books for the dashboard
            await tx.sadhanaLog.upsert({
                where: { userId_date: { userId, date: today } },
                update: {
                    totalRead: { increment: delta }
                },
                create: {
                    userId,
                    date: today,
                    totalRead: delta > 0 ? delta : 0
                }
            });

            return updated;
        });

        revalidatePath("/");
        return { data: result };
    } catch (error) {
        console.error(error);
        return { error: "Could not update progress" };
    }
}

export async function deleteBookAction(bookId: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        // 1. Check if the book is private or public
        const book = await db.book.findUnique({
            where: { id: bookId },
            select: { userId: true }
        });

        if (!book) return { success: false, error: "Book not found" };

        // 2. Perform deletion
        if (book.userId === userId) {
            /** * PRIVATE BOOK: Delete the book and progress.
             * Note: If you haven't set "onDelete: Cascade" in your Prisma schema,
             * you must delete UserBookProgress first.
             */
            await db.$transaction([
                db.userBookProgress.deleteMany({
                    where: { bookId, userId }
                }),
                db.book.delete({
                    where: { id: bookId }
                })
            ]);
        } else {
            /** * PUBLIC BOOK: Only remove the user's progress connection.
             * This removes it from their shelf without deleting the global book.
             */
            await db.userBookProgress.delete({
                where: {
                    userId_bookId: {
                        userId,
                        bookId
                    }
                }
            });
        }

        revalidatePath("/books");
        revalidatePath("/sadhak");
        return { success: true };

    } catch (error) {
        console.error("Delete Book Error:", error);
        return { success: false, error: "Failed to remove book from shelf" };
    }
}

export async function resetBookProgressAction(progressId: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        // Using only the unique record ID
        const updatedProgress = await db.userBookProgress.update({
            where: {
                id: progressId,
            },
            data: {
                currentValue: 0,
                isCompleted: false,
                // Streaks remain untouched per instructions
            },
        });

        revalidatePath("/books");
        return { success: true, data: updatedProgress };
    } catch (error) {
        console.error("Reset Progress Error:", error);
        return { success: false, error: "Failed to reset progress" };
    }
}