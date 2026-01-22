import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { userProfileSchema } from "@/schemas/user-profile.schema";

export async function GET() {
    try {
        const userId = await getCurrentUserId();

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
                phoneNumber: true,
                dateOfBirth: true,
                profileImage: true,
                templeName: true,
                bhaktiStartDate: true,
                isInitiated: true,
                roundsGoal: true,
                hearingGoal: true,
                readingGoal: true,
                aartisGoal: true,
                createdAt: true,
                updatedAt: true,
                // 🔹 Fetch the application status
                mentorApplication: {
                    select: {
                        status: true
                    }
                }
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // 🔹 Compute isVerified and applicationStatus
        // This extracts mentorApplication and puts EVERYTHING ELSE into 'responseData'
        const { mentorApplication, ...responseData } = {
            ...user,
            isVerified: user.role === "MENTOR" && user.mentorApplication?.status === "APPROVED",
            applicationStatus: user.mentorApplication?.status || null
        };

        // Now 'responseData' does not contain 'mentorApplication'
        return NextResponse.json(responseData);

    } catch (error) {
        console.error("GET /user/me ERROR:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}



export async function PUT(req: Request) {
    const userId = await getCurrentUserId();

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const parsed = userProfileSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { errors: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const data = parsed.data;

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            name: data.name,
            phoneNumber: data.phoneNumber,
            templeName: data.templeName,
            isInitiated: data.isInitiated,
            roundsGoal: data.roundsGoal,
            hearingGoal: data.hearingGoal,
            readingGoal: data.readingGoal,
            aartisGoal: data.aartisGoal,
            dateOfBirth: data.dateOfBirth
                ? new Date(data.dateOfBirth)
                : null,
            bhaktiStartDate: data.bhaktiStartDate
                ? new Date(data.bhaktiStartDate)
                : null,
        },
        select: {
            id: true,
            name: true,
            phoneNumber: true,
            templeName: true,
            isInitiated: true,
            roundsGoal: true,
            hearingGoal: true,
            readingGoal: true,
            aartisGoal: true,
            updatedAt: true,
        },
    });

    return NextResponse.json(updatedUser);
}