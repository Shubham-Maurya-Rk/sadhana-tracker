"use server";

import { prisma as db } from "@/lib/prisma"; // Adjust this to your prisma client path
import { getCurrentUserId } from "@/lib/auth"; // Adjust to your auth (Clerk/NextAuth)
import { MessageData, ConversationData } from "@/types/chat"; // We'll define types below

export async function sendMessage(receiverId: string, content: string) {
    try {
        const senderId = await getCurrentUserId();

        if (!senderId) return { success: false, error: "Unauthorized" };

        const message = await db.message.create({
            data: {
                content,
                senderId,
                receiverId,
            },
        });

        return { success: true, data: message };
    } catch (error) {
        console.error("SendMessage Error:", error);
        return { success: false, error: "Failed to send message" };
    }
}

export async function getMessages(otherUserId: string) {
    try {
        const currentUserId = await getCurrentUserId();

        if (!currentUserId) return { data: null, error: "Unauthorized" };

        const messages = await db.message.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: currentUserId },
                ],
            },
            orderBy: { createdAt: "asc" },
        });

        // Mark received messages as read
        await db.message.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: currentUserId,
                isRead: false,
            },
            data: { isRead: true },
        });

        return { data: messages, error: null };
    } catch (error) {
        return { data: null, error: "Failed to fetch messages" };
    }
}

// app/actions/chat.ts
export async function getConversations(openId?: string | null) {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) return { data: null, userId: null, error: "Unauthorized" };

        // 1. Fetch existing conversations (same as your current logic)
        const messages = await db.message.findMany({
            where: { OR: [{ senderId: currentUserId }, { receiverId: currentUserId }] },
            include: { sender: true, receiver: true },
            orderBy: { createdAt: "desc" },
        });

        const conversationMap = new Map();
        messages.forEach((msg) => {
            const otherUser = msg.senderId === currentUserId ? msg.receiver : msg.sender;
            if (!otherUser) return;
            if (!conversationMap.has(otherUser.id)) {
                conversationMap.set(otherUser.id, {
                    id: otherUser.id,
                    name: otherUser.name,
                    image: otherUser.profileImage,
                    lastMessage: msg.content,
                    lastMessageTime: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unreadCount: msg.receiverId === currentUserId && !msg.isRead ? 1 : 0,
                });
            }
        });

        const conversations = Array.from(conversationMap.values());

        // 2. NEW CHAT LOGIC: If openId is provided but not in existing conversations
        if (openId && !conversationMap.has(openId)) {
            const newUser = await db.user.findUnique({
                where: { id: openId },
                select: { id: true, name: true, profileImage: true }
            });

            if (newUser) {
                conversations.unshift({
                    id: newUser.id,
                    name: newUser.name,
                    image: newUser.profileImage,
                    lastMessage: "Start a new conversation...",
                    lastMessageTime: "",
                    unreadCount: 0,
                });
            }
        }

        return { data: conversations as ConversationData[], userId: currentUserId, error: null };
    } catch (error) {
        return { data: null, userId: null, error: "Error" };
    }
}

export async function getSadhakaStats(userId: string) {
    try {
        const stats = await db.user.findUnique({
            where: { id: userId },
            select: {
                currentStreak: true,
                highestStreak: true,
                roundsGoal: true,
                learningPosts: { take: 3, orderBy: { createdAt: 'desc' } },
                bookProgressions: { include: { book: true } }
            }
        });
        return { data: stats };
    } catch (e) {
        return { error: "Failed to fetch stats" };
    }
}