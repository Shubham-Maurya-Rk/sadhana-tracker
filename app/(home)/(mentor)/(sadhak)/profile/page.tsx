"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
    userProfileSchema,
    UserProfileForm,
} from "@/schemas/user-profile.schema";
import { toast } from "sonner";
import { Check, Copy, Flame, GraduationCap } from "lucide-react";
import { requestMentorStatus } from "@/app/actions/profile";
import { useSession } from "next-auth/react";

/* Types */
type User = {
    id: string;
    email: string;
    role: string;
    name: string;
    phoneNumber?: string | null;
    dateOfBirth?: string | null;
    profileImage?: string | null;
    templeName?: string | null;
    bhaktiStartDate?: string | null;
    isInitiated: boolean;
    roundsGoal: number;
    // New Fields
    hearingGoal: number;
    readingGoal: number;
    aartisGoal: number;
    isVerified: boolean;
};

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setissubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRequesting, setIsRequesting] = useState(false);
    const { update } = useSession();
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("ID copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const form = useForm<UserProfileForm>({
        resolver: zodResolver(userProfileSchema),
        defaultValues: {
            name: "",
            phoneNumber: null,
            dateOfBirth: null,
            templeName: null,
            bhaktiStartDate: null,
            isInitiated: false,
            roundsGoal: 16,
            // New Fields
            hearingGoal: 0,
            readingGoal: 0,
            aartisGoal: 0,
        },
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = form;
    const toDateInputValue = (date?: string | null) => {
        if (!date) return null;
        return new Date(date).toISOString().split("T")[0];
    };

    /* 🔹 FETCH USER */
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/user/me", {
                    credentials: "include",
                });

                if (!res.ok) throw new Error("Failed to fetch user");

                const data: User = await res.json();
                setUser(data);
                console.log(data)

                /* Populate form */
                reset({
                    name: data.name,
                    phoneNumber: data.phoneNumber ?? null,
                    dateOfBirth: toDateInputValue(data.dateOfBirth),
                    templeName: data.templeName ?? null,
                    bhaktiStartDate: toDateInputValue(data.bhaktiStartDate),
                    isInitiated: data.isInitiated,
                    roundsGoal: data.roundsGoal,
                    // New Fields
                    hearingGoal: data.hearingGoal,
                    readingGoal: data.readingGoal,
                    aartisGoal: data.aartisGoal
                });
            } catch (error) {
                toast.error("Failed to fetch user");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [reset]);

    const handleMentorRequest = async () => {
        setIsRequesting(true);
        const res = await requestMentorStatus();

        if (res.success) {
            toast.success("Mentorship Request Received!", {
                description: "Thank you for your desire to serve. Admin will review your profile soon.",
                duration: 5000,
            });

            // TRIGGER THE TOKEN UPDATE HERE
            // This forces Next-Auth to run the backend 'jwt' and 'session' callbacks
            // It will pick up the 'MENTOR' role you just saved in the database
            await update();
            // 🔹 Update local state so UI reflects the change immediately
            if (user) {
                setUser({
                    ...user,
                    role: "MENTOR", // Update role as per your server action logic
                });
            }
        } else {
            toast.error(res.error || "Failed to send request.");
        }
        setIsRequesting(false);
    };

    const onSubmit = async (data: UserProfileForm) => {
        console.log("Validated Payload →", data);
        setissubmitting(true);
        const toastId = toast.loading("Updating profile...");

        try {
            const res = await fetch("/api/user/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(
                    result?.message || "Failed to update profile"
                );
            }

            toast.success("Profile updated successfully", {
                id: toastId,
            });

            setIsEditing(false);
        } catch (error) {
            console.error(error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Something went wrong",
                {
                    id: toastId,
                }
            );
        } finally {
            setissubmitting(false);
        }
    };


    /* Loading state */
    if (loading) {
        return <p className="text-center py-10">Loading profile...</p>;
    }

    /* Error state */
    if (!user) {
        return <p className="text-center py-10">User not found</p>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
            {/* Header */}
            <Card>
                <CardContent className="flex flex-col sm:flex-row gap-4 p-6">
                    <Image
                        src={user.profileImage || "/avatar.jpg"}
                        alt="Profile"
                        width={90}
                        height={90}
                        className="rounded-full border mx-auto sm:mx-0 object-cover"
                    />

                    <div className="flex-1 min-w-0 text-center sm:text-left">
                        {isEditing ? (
                            <div className="space-y-2">
                                <Input {...register("name")} className="h-8" />
                                {errors.name && (
                                    <p className="text-xs text-red-500">{errors.name.message}</p>
                                )}
                            </div>
                        ) : (
                            <h2 className="text-2xl font-semibold truncate">{user.name}</h2>
                        )}

                        {/* Email & ID Section with Copy Option */}
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                            <p className="text-muted-foreground truncate text-sm">{user.email}</p>
                            <button
                                onClick={() => copyToClipboard(user.id)}
                                className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-primary"
                                title="Copy User ID"
                            >
                                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
                            {/* Role Badge */}
                            <Badge
                                variant="outline"
                                className="px-3 py-1 capitalize border-primary/30 bg-primary/5 text-primary font-medium flex items-center gap-1.5 shadow-sm"
                            >
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                {user.role.toLowerCase()}
                            </Badge>

                            {/* Initiated Badge */}
                            {watch("isInitiated") && (
                                <Badge
                                    variant="secondary"
                                    className="px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200/50 font-semibold flex items-center gap-1.5 shadow-sm"
                                >
                                    <Flame className="h-3.5 w-3.5 text-orange-600 fill-orange-600" />
                                    Initiated
                                </Badge>
                            )}

                            {/* Verified Status */}
                            {user.isVerified && (
                                <Badge
                                    className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 font-medium shadow-sm hover:bg-blue-100 transition-colors"
                                >
                                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    Verified Mentor
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* --- ACTION BUTTONS --- */}
                    <div className="w-full sm:w-auto flex flex-col gap-2 shrink-0">
                        {!isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </Button>

                                {user.role === 'SADHAK' && (
                                    <Button
                                        variant="secondary"
                                        className="w-full sm:w-auto gap-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                                        onClick={handleMentorRequest}
                                        disabled={isRequesting}
                                    >
                                        <GraduationCap className="h-4 w-4" />
                                        {isRequesting ? "Sending..." : "Become a Mentor"}
                                    </Button>
                                )}
                            </>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    className="flex-1 sm:w-auto"
                                    onClick={() => {
                                        reset();
                                        setIsEditing(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 sm:w-auto">Save</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Phone Number">
                            <Input disabled={!isEditing} {...register("phoneNumber")} />
                            {errors.phoneNumber && (
                                <p className="text-sm text-red-500">
                                    {errors.phoneNumber.message}
                                </p>
                            )}
                        </Field>

                        <Field label="Date of Birth">
                            <Input type="date" disabled={!isEditing} {...register("dateOfBirth")} />
                        </Field>

                        <Field label="Temple Name">
                            <Input disabled={!isEditing} {...register("templeName")} />
                        </Field>

                        <Field label="Bhakti Start Date">
                            <Input
                                type="date"
                                disabled={!isEditing}
                                {...register("bhaktiStartDate")}
                            />
                        </Field>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Flame className="h-5 w-5 text-orange-500" />
                            Spiritual Goals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Initiation Status */}
                        <Field label="Initiated Status">
                            <div className="flex items-center gap-3">
                                <Switch
                                    disabled={!isEditing}
                                    checked={watch("isInitiated")}
                                    onCheckedChange={(val) => setValue("isInitiated", val)}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {watch("isInitiated") ? "Initiated" : "Aspiring"}
                                </span>
                            </div>
                        </Field>

                        {/* Chanting Goal */}
                        <Field label="Daily Chanting Goal (Rounds)">
                            <Input
                                type="number"
                                placeholder="e.g. 16"
                                disabled={!isEditing}
                                {...register("roundsGoal", { valueAsNumber: true })}
                            />
                        </Field>

                        {/* Hearing Goal */}
                        <Field label="Daily Hearing Goal (Minutes)">
                            <Input
                                type="number"
                                placeholder="e.g. 30"
                                disabled={!isEditing}
                                {...register("hearingGoal", { valueAsNumber: true })}
                            />
                        </Field>

                        {/* Reading Goal */}
                        <Field label="Daily Reading Goal (Pages/Shlokas)">
                            <Input
                                type="number"
                                placeholder="e.g. 20"
                                disabled={!isEditing}
                                {...register("readingGoal", { valueAsNumber: true })}
                            />
                        </Field>

                        {/* Aartis Goal */}
                        <Field label="Daily Aartis Goal (Count)">
                            <Input
                                type="number"
                                placeholder="e.g. 2"
                                min={0}
                                max={4}
                                disabled={!isEditing}
                                {...register("aartisGoal", { valueAsNumber: true })}
                            />
                        </Field>
                    </CardContent>
                </Card>

                {isEditing && (
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>

                    </div>
                )}
            </form>
        </div>
    );
}

/* Field wrapper */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
