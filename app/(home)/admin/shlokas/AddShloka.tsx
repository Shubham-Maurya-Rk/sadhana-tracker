"use client";

import { useState } from "react";
import { createInspiration } from "@/app/actions/inspiration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2, Link2, Plus } from "lucide-react";
import { toast } from "sonner";

export function AddShloka() {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsPending(true);
        const formData = Object.fromEntries(new FormData(e.currentTarget));

        const res = await createInspiration("SHLOKA", formData);
        if (res.success) {
            toast.success("Shloka added to the repository");
            setOpen(false);
            (e.target as HTMLFormElement).reset();
        } else {
            toast.error("Error saving shloka");
        }
        setIsPending(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-xl font-black gap-2 shadow-lg shadow-primary/20">
                    <Plus size={18} /> Add Shloka
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
                <DialogHeader><DialogTitle className="text-2xl font-black italic">New Shloka Entry</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Sanskrit & Translation</label>
                        <Textarea name="text" required className="rounded-xl min-h-[120px] font-serif" placeholder="देहिनोऽस्मिन्यथा देहे..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Scripture</label>
                            <Select name="type" defaultValue="GITA">
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GITA">Bhagavad Gita</SelectItem>
                                    <SelectItem value="BHAGAVATAM">Srimad Bhagavatam</SelectItem>
                                    <SelectItem value="CHAITANYA">Chaitanya Charitamrta</SelectItem>
                                    <SelectItem value="OTHERS">Others</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Reference</label>
                            <Input name="reference" placeholder="e.g. BG 2.13" required className="rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Source URL</label>
                        <div className="relative">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input name="sourceLink" type="url" placeholder="vedabase.io/..." className="rounded-xl pl-9" />
                        </div>
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full rounded-xl h-12 font-black bg-orange-600 hover:bg-orange-700">
                        {isPending ? <Loader2 className="animate-spin" /> : "Save Shloka"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}