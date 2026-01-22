"use client";

import { useTransition, useState } from "react"; // Added useState
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    UserPlus, UserCheck, X, Loader2, Clock, AlertTriangle
} from "lucide-react";
import { removeMentor, sendMentorshipRequest } from "@/app/actions/mentorship";

interface Props {
    mentorId: string;
    status?: "PENDING" | "ACCEPTED" | string;
    mentorName: string;
}

export function MentorshipActionButton({ mentorId, status, mentorName }: Props) {
    const [isPending, startTransition] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false); // State for confirmation

    const handleAction = async () => {
        startTransition(async () => {
            if (status === "ACCEPTED") {
                const res = await removeMentor(mentorId);
                if (res?.success) {
                    toast.success(`You are no longer being tracked by ${mentorName}`);
                    setShowConfirm(false);
                } else {
                    toast.error(res?.error || "Failed to remove mentor");
                }
            } else {
                const res = await sendMentorshipRequest(mentorId);
                if (res?.success) {
                    toast.success(`Request sent to ${mentorName}`);
                } else {
                    toast.error(res?.error || "Failed to send request");
                }
            }
        });
    };

    // 1. ACCEPTED STATE (With Two-Step Confirmation)
    if (status === "ACCEPTED") {
        if (showConfirm) {
            return (
                <div className="flex gap-2 w-full">
                    <Button
                        variant="destructive"
                        disabled={isPending}
                        onClick={handleAction}
                        className="flex-1 h-10 gap-2"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        Confirm Remove
                    </Button>
                    <Button
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setShowConfirm(false)}
                        className="px-3 h-10"
                    >
                        Cancel
                    </Button>
                </div>
            );
        }

        return (
            <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setShowConfirm(true)}
                className="w-full h-10 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
                {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <X className="w-4 h-4" />
                )}
                Remove Mentor
            </Button>
        );
    }

    // 2. PENDING STATE (Unchanged)
    if (status === "PENDING") {
        return (
            <Button
                variant="secondary"
                disabled
                className="w-full h-10 gap-2 bg-amber-100 text-amber-700 border-amber-200 cursor-default"
            >
                <Clock className="w-4 h-4" />
                Pending Approval
            </Button>
        );
    }

    // 3. DEFAULT STATE (Request Tracking)
    return (
        <Button
            variant="outline"
            disabled={isPending}
            onClick={handleAction}
            className="w-full h-10 gap-2 hover:bg-primary/5 border-primary/20 text-primary"
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <UserPlus className="w-4 h-4" />
            )}
            {isPending ? "Sending..." : "Request Tracking"}
        </Button>
    );
}