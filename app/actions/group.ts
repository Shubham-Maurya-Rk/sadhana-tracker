"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth"; // Your auth helper
import { CreateGroupSchema } from "@/schemas/group.schema";
import { revalidatePath } from "next/cache";
import { endOfMonth, format, startOfMonth } from "date-fns";

// group.ts
export async function createGroup(formData: { name: string }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Unauthorized" };

    const validatedFields = CreateGroupSchema.safeParse(formData);
    if (!validatedFields.success) {
      return { error: validatedFields.error.flatten().fieldErrors.name?.[0] };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== "MENTOR") {
      return { error: "Only mentors can create groups." };
    }

    // Capture the created group
    const newGroup = await prisma.group.create({
      data: {
        name: validatedFields.data.name,
        mentorId: userId,
      },
    });

    revalidatePath("/mentor/groups");

    // Return the data so the client can update state without a refresh
    return {
      success: true,
      data: {
        id: newGroup.id,
        name: newGroup.name,
        memberCount: 0
      }
    };
  } catch (error) {
    console.error("Group Creation Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
export type GroupData = {
  id: string;
  name: string;
  memberCount: number;
};

export async function getMentorGroups(): Promise<{ data: GroupData[]; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { data: [], error: "Unauthorized" };

    // Fetch from DB - Prisma returns a type that HAS _count
    const groupsFromDb = await prisma.group.findMany({
      where: { mentorId: userId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // TRANSFORM: Convert Prisma shape to GroupData shape
    const formattedGroups: GroupData[] = groupsFromDb.map((g) => ({
      id: g.id,
      name: g.name,
      memberCount: g._count.members, // Accessing it here is safe!
    }));

    return { data: formattedGroups };
  } catch (e) {
    console.error(e);
    return { data: [], error: "Failed to fetch groups" };
  }
}

export type MemberData = {
  id: string;
  name: string;
  image?: string | null;
  currentStreak: number;
  highestStreak: number;
  lastShloka?: string;
  bookName?: string;
};

export async function getGroupMembers(groupId: string): Promise<{ data: MemberData[]; error?: string }> {
  try {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            currentStreak: true,
            highestStreak: true,
            // Assuming you have a relation or field for current learning
            // Adjust based on your actual Shloka model
          }
        }
      }
    });

    const formattedMembers: MemberData[] = members.map((m) => ({
      id: m.user.id,
      name: m.user.name || "Unknown Sadhaka",
      image: m.user.profileImage || null,
      currentStreak: m.user.currentStreak || 0,
      highestStreak: m.user.highestStreak || 0,
      // Placeholder for your shloka logic
      lastShloka: "2.13",
      bookName: "Bhagavad Gita"
    }));

    return { data: formattedMembers };
  } catch (error) {
    return { data: [], error: "Failed to fetch members" };
  }
}

export async function getMentorshipRequests() {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Unauthorized" };

  const requests = await prisma.mentorshipRequest.findMany({
    where: {
      receiverId: userId,
      status: "PENDING"
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          // Changed 'image' to 'profileImage' to match your schema
          profileImage: true,
          currentStreak: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return { data: requests };
}

export async function handleRequestAction(requestId: string, action: "ACCEPT" | "REJECT", groupId?: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Unauthorized" };

    if (action === "REJECT") {
      await prisma.mentorshipRequest.delete({ where: { id: requestId } });
    } else {
      if (!groupId) return { error: "Please select a group to add the Sadhaka to." };

      const request = await prisma.mentorshipRequest.findUnique({ where: { id: requestId } });
      if (!request) return { error: "Request not found" };

      // Use a transaction: Update request status and add to GroupMember
      await prisma.$transaction([
        prisma.mentorshipRequest.update({
          where: { id: requestId },
          data: { status: "ACCEPTED" }
        }),
        prisma.groupMember.create({
          data: {
            groupId: groupId,
            userId: request.senderId,
          }
        })
      ]);
    }

    revalidatePath("/mentor/requests");
    return { success: true };
  } catch (error) {
    return { error: "Action failed. Please try again." };
  }
}

export async function updateGroup(id: string, name: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Unauthorized" };

    const updatedGroup = await prisma.group.update({
      where: { id, mentorId: userId },
      data: { name },
    });

    revalidatePath("/mentor/groups");
    return { success: true, data: updatedGroup };
  } catch (error) {
    return { error: "Failed to update group" };
  }
}

export async function deleteGroup(id: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Unauthorized" };

    await prisma.group.delete({
      where: { id, mentorId: userId },
    });

    revalidatePath("/mentor/groups");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete group" };
  }
}

// app/actions/group.ts

// app/actions/group.ts

// app/actions/group.ts

export async function removeMemberFromGroup(groupId: string, userId: string) {
  try {
    const mentorId = await getCurrentUserId();
    if (!mentorId) return { error: "Unauthorized" };

    await prisma.$transaction(async (tx) => {
      // 1. Delete the specific link in the GroupMember table
      // This satisfies the "Required Relation" by removing the child record 
      // instead of trying to make it orphaned.
      await tx.groupMember.deleteMany({
        where: {
          groupId: groupId,
          userId: userId,
        }
      });

      // 2. Delete the mentorship request record
      await tx.mentorshipRequest.deleteMany({
        where: {
          senderId: userId,
          receiverId: mentorId,
          status: "ACCEPTED"
        }
      });
    });

    revalidatePath("/mentor/groups");
    return { success: true };
  } catch (error) {
    console.error("Remove Member Error:", error);
    return { error: "Failed to remove member. They might belong to a required relation." };
  }
}


// app/actions/group.ts

export async function changeMemberGroup(memberId: string, currentGroupId: string, newGroupId: string) {
  try {
    const mentorId = await getCurrentUserId();
    if (!mentorId) return { error: "Unauthorized" };

    // We update the group association. 
    // If you have a join table like GroupMember:
    await prisma.groupMember.updateMany({
      where: {
        userId: memberId,
        groupId: currentGroupId
      },
      data: {
        groupId: newGroupId
      }
    });

    revalidatePath("/mentor/groups");
    return { success: true };
  } catch (error) {
    console.error("Change Group Error:", error);
    return { error: "Failed to move member to the new group" };
  }
}
// app/actions/mentor.ts

export async function getSadhakaDetailedProgress(sadhakId: string, month: Date) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) throw new Error("Unauthorized");

    // 1. ACCESS CONTROL
    // We check if the current user is the owner OR a mentor managing a group the sadhak has joined
    const isAuthorized = await prisma.user.findFirst({
      where: {
        id: sadhakId,
        OR: [
          { id: currentUserId }, // Is the user looking at their own profile?
          {
            joinedGroups: {
              some: {
                group: { mentorId: currentUserId }
              }
            }
          }
        ]
      }
    });

    if (!isAuthorized) {
      throw new Error("ACCESS DENIED: YOU ARE NOT AUTHORIZED TO VIEW THIS SADHAK'S PROGRESS.");
    }

    // 2. TIMEZONE NORMALIZATION
    // Important: We normalize the month boundaries to ensure the heatmap doesn't miss logs
    const start = startOfMonth(new Date(month));
    const end = endOfMonth(new Date(month));

    // 3. FETCH COMPREHENSIVE DATA
    const data = await prisma.user.findUnique({
      where: { id: sadhakId },
      select: {
        id: true,
        name: true,
        profileImage: true,
        templeName: true,
        role: true,
        // Spiritual Goals
        roundsGoal: true,
        readingGoal: true,
        hearingGoal: true,
        aartisGoal: true,
        // Overall Streaks (User level)
        currentStreak: true,
        highestStreak: true,

        // Heatmap Data (Sadhana Logs)
        sadhanaLogs: {
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { date: 'asc' }
        },

        // Book Reading Progress & Streaks
        bookProgressions: {
          include: {
            book: {
              select: {
                title: true,
                author: true,
              }
            }
          },
          orderBy: { lastReadDate: 'desc' }
        },

        // Shloka Challenges & Streaks
        shlokaChallenges: {
          include: {
            shlokas: {
              orderBy: { reference: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },

        // Mentorship Connections check
        receivedMentorshipRequests: {
          where: { senderId: currentUserId }
        }
      }
    });

    if (!data) throw new Error("SADHAKA RECORD NOT FOUND.");

    return {
      success: true,
      data,
      meta: {
        viewingMonth: format(month, 'MMMM yyyy'),
        isOwnProfile: currentUserId === sadhakId
      }
    };
  } catch (error: any) {
    console.error("[SERVER_ACTION_ERROR]:", error);
    return { success: false, error: error.message || "AN UNEXPECTED ERROR OCCURRED." };
  }
}