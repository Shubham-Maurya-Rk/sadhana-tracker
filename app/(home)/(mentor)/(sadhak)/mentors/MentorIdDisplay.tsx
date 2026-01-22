"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";

export function MentorIdDisplay({ id }: { id: string }) {
    const copyId = () => {
        navigator.clipboard.writeText(id);
        toast.success("ID copied to clipboard");
    };

    return (
        <span
            onClick={copyId}
            className="text-[10px] font-mono text-muted-foreground/60 hover:text-primary cursor-pointer transition-colors flex items-center gap-1 group/id"
            title="Click to copy ID"
        >
            ID: {id}
            <Copy className="w-2.5 h-2.5 opacity-0 group-hover/id:opacity-100 transition-opacity" />
        </span>
    );
}