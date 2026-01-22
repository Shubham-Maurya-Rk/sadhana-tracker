"use client";

import { useState, useTransition } from "react";
import { createGroup, type GroupData } from "@/app/actions/group";
import { CreateGroupSchema } from "@/schemas/group.schema";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader,
    DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface CreateGroupDialogProps {
    onGroupCreated: (newGroup: GroupData) => void;
}

export default function CreateGroupDialog({ onGroupCreated }: CreateGroupDialogProps) {
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const handleCreate = () => {
        setError(null);
        const result = CreateGroupSchema.safeParse({ name });
        if (!result.success) {
            setError(result.error.flatten().fieldErrors.name?.[0] || "Invalid name");
            return;
        }

        startTransition(async () => {
            const response = await createGroup({ name });

            if (response.error) {
                setError(response.error);
                toast.error(response.error);
            } else if (response.data) {
                toast.success("Group created successfully!");
                onGroupCreated(response.data); // Update parent state immediately
                setName("");
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="rounded-full h-8 w-8">
                    <Plus className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Group Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Morning Sadhakas"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isPending}
                            className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        className="w-full"
                        onClick={handleCreate}
                        disabled={isPending || !name}
                    >
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Group"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}