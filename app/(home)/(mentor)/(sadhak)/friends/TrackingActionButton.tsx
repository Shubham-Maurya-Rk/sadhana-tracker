"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserMinus, ShieldOff, Loader2 } from "lucide-react";
import { stopTracking, removeAuthority } from "@/app/actions/friend";

interface TrackingProps {
    targetId: string;
    targetName: string;
    mode: "STOP_TRACKING" | "REVOKE_AUTHORITY";
}

export function TrackingActionButton({ targetId, targetName, mode }: TrackingProps) {
    const [isPending, startTransition] = useTransition();

    const handleAction = () => {
        startTransition(async () => {
            const res = mode === "STOP_TRACKING"
                ? await stopTracking(targetId)
                : await removeAuthority(targetId);

            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.error || "Action failed");
            }
        });
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={handleAction}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : mode === "STOP_TRACKING" ? (
                <UserMinus className="w-4 h-4 mr-2" />
            ) : (
                <ShieldOff className="w-4 h-4 mr-2" />
            )}
            {mode === "STOP_TRACKING" ? "Stop Tracking" : "Revoke Authority"}
        </Button>
    );
}