"use client";

import { useState } from "react";
import { updateMentorStatus } from "@/app/actions/mentorship";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
    userId: string;
    appId: string;
}

export function MentorActionButtons({ userId, appId }: Props) {
    const [isPending, setIsPending] = useState(false);

    const handleUpdate = async (status: "APPROVED" | "REJECTED") => {
        setIsPending(true);

        // Trigger toast promise for a better UX
        toast.promise(updateMentorStatus(userId, appId, status), {
            loading: `${status === "APPROVED" ? "Approving" : "Rejecting"} application...`,
            success: () => {
                setIsPending(false);
                return `Mentor successfully ${status.toLowerCase()}`;
            },
            error: (err) => {
                setIsPending(false);
                return err || "Something went wrong";
            },
        });
    };

    return (
        <div className="flex items-center gap-3 shrink-0">
            <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleUpdate("REJECTED")}
                className="rounded-xl font-bold text-destructive hover:bg-destructive/10 gap-2"
            >
                <X size={16} /> Reject
            </Button>

            <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleUpdate("APPROVED")}
                className="rounded-xl px-6 font-black gap-2 shadow-lg shadow-primary/20"
            >
                {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Check size={16} />}
                Approve Mentor
            </Button>
        </div>
    );
}