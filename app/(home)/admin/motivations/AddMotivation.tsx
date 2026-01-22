"use client";

import { useState } from "react";
import { createInspiration } from "@/app/actions/inspiration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";

export function AddMotivation() {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsPending(true);
        const formData = Object.fromEntries(new FormData(e.currentTarget));

        const res = await createInspiration("MOTIVATION", formData);
        if (res.success) {
            toast.success("Added to daily rotation pool!");
            setOpen(false);
            (e.target as HTMLFormElement).reset();
        } else {
            toast.error("Failed to save motivation");
        }
        setIsPending(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-xl font-black gap-2 shadow-lg shadow-primary/20">
                    <Plus size={18} /> Add Motivation
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
                <DialogHeader><DialogTitle className="text-2xl font-black">New Motivation</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Quote Text</label>
                        <Textarea name="text" required className="rounded-xl min-h-[100px]" placeholder="Enter spiritual quote..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Type</label>
                            <Select name="type" defaultValue="JAPA">
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="JAPA">Japa</SelectItem>
                                    <SelectItem value="LECTURE">Lecture</SelectItem>
                                    <SelectItem value="BOOK">Book</SelectItem>
                                    <SelectItem value="OTHERS">Others</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Author</label>
                            <Input name="author" defaultValue="Srila Prabhupada" className="rounded-xl" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Reference</label>
                            <Input name="reference" placeholder="e.g. BG 4.13" className="rounded-xl" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Source Link</label>
                            <div className="relative">
                                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <Input name="sourceLink" type="url" placeholder="https://..." className="rounded-xl pl-9" />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full rounded-xl h-12 font-black">
                        {isPending ? <Loader2 className="animate-spin" /> : "Save Motivation"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}