export interface UserProfile {
    id: number;
    email: string;
    role: "admin" | "user" | "SADHAK";
    name: string;
    phoneNumber: string;
    dateOfBirth: string;
    profileImage?: string;
    templeName?: string;
    bhaktiStartDate?: string;
    isInitiated: boolean;
    roundsGoal?: number;
    createdAt: string;
    updatedAt: string;
}
