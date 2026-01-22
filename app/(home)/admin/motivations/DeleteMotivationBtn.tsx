"use client";

import { useState } from "react";
import { deleteInspiration } from "@/app/actions/inspiration";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteMotivationBtn({ id }: { id: string }) {
    const [isPending, setIsPending] = useState(false);

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this motivation?")) return;

        setIsPending(true);
        const res = await deleteInspiration(id, "MOTIVATION");

        if (res.success) {
            toast.success("Motivation deleted");
        } else {
            toast.error(res.error);
            setIsPending(false);
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            onClick={handleDelete}
            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </Button>
    );
}