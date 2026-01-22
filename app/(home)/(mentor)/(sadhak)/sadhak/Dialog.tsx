"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea" // Added Textarea import
import { format, isValid } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { sadhanaSchema, SadhanaFormValues } from "@/schemas/sadhana.schema"
import { toast } from "sonner"
import { BookOpen, Loader2 } from "lucide-react"
import { getDailySadhanaAction, upsertSadhanaAction } from "@/app/actions/sadhana"
import Link from "next/link"

interface SadhanaGoal {
    roundsGoal: number;
    readingGoal: number;
    hearingGoal: number;
}

export function SadhanaDialog({
    open,
    selectedDate,
    goals,
    setOpen,
}: {
    open: boolean
    selectedDate: Date,
    goals: SadhanaGoal
    setOpen: (open: boolean) => void
}) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<SadhanaFormValues>({
        resolver: zodResolver(sadhanaSchema),
        defaultValues: {
            date: selectedDate,
            rounds: goals.roundsGoal,
            lecture: goals.hearingGoal,
            mangal: false,
            darshan: false,
            bhoga: false,
            gaura: false,
            wakeup: "",
            sleep: "",
            missedNote: "", // Added default value
        },
    })

    useEffect(() => {
        const fetchAndPopulateForm = async () => {
            if (!open || !selectedDate || !isValid(selectedDate)) return;

            try {
                const result = await getDailySadhanaAction(selectedDate);

                if (result.success) {
                    const log = result.data;

                    form.reset({
                        date: selectedDate,
                        rounds: log?.chantingRounds ?? result.roundsGoal,
                        lecture: log?.lectureDuration ?? 0,
                        mangal: log?.mangalAarti ?? false,
                        darshan: log?.darshanAarti ?? false,
                        bhoga: log?.bhogaAarti ?? false,
                        gaura: log?.gauraAarti ?? false,
                        wakeup: log?.wakeUpTime ? format(new Date(log.wakeUpTime), "HH:mm") : "",
                        sleep: log?.sleepTime ? format(new Date(log.sleepTime), "HH:mm") : "",
                        missedNote: log?.missedNote ?? "", // Fetching missedNote from DB
                    });
                } else {
                    form.setValue("date", selectedDate);
                    toast.error("Could not load previous data.");
                }
            } catch (error) {
                console.error("Error in useEffect fetching sadhana:", error);
            }
        };

        fetchAndPopulateForm();
    }, [selectedDate, open, form]);

    const onSubmit = async (values: SadhanaFormValues) => {
        setIsSubmitting(true);

        const createDateTime = (timeStr: string | undefined) => {
            if (!timeStr) return null;
            const [hours, minutes] = timeStr.split(":").map(Number);
            const dt = new Date(values.date);
            dt.setHours(hours, minutes, 0, 0);
            return dt;
        };

        const payload = {
            date: values.date,
            chantingRounds: Number(values.rounds),
            lectureDuration: Number(values.lecture),
            mangalAarti: values.mangal,
            darshanAarti: values.darshan,
            bhogaAarti: values.bhoga,
            gauraAarti: values.gaura,
            wakeUpTime: createDateTime(values.wakeup),
            sleepTime: createDateTime(values.sleep),
            missedNote: values.missedNote, // Added to payload
        };

        try {
            const result = await upsertSadhanaAction(payload);

            if (result.success) {
                toast.success("Sadhana logged successfully!");
                setOpen(false);
                form.reset();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An error occurred while saving your sadhana.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Daily Sadhana Entry</DialogTitle>
                        <DialogDescription>
                            Update your spiritual progress for{" "}
                            <span className="font-semibold text-primary">
                                {selectedDate && isValid(selectedDate) ? format(selectedDate, "PPPP") : "today"}
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="rounds">Chanting Rounds</Label>
                                <Input id="rounds" type="number" {...form.register("rounds")} />
                                {form.formState.errors.rounds && (
                                    <p className="text-[12px] text-destructive">{form.formState.errors.rounds.message}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lecture">Lecture (mins)</Label>
                                <Input id="lecture" type="number" {...form.register("lecture")} />
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <Label>Aartis Attended</Label>
                            <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 bg-muted/30">
                                {["mangal", "darshan", "bhoga", "gaura"].map((name) => (
                                    <label key={name} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted p-1 rounded transition-colors">
                                        <Checkbox
                                            checked={form.watch(name as any)}
                                            onCheckedChange={(v) => form.setValue(name as any, !!v)}
                                        />
                                        {name.charAt(0).toUpperCase() + name.slice(1)} Aarti
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Sleep Time</Label>
                                <Input type="time" {...form.register("sleep")} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Wake Up Time</Label>
                                <Input type="time" {...form.register("wakeup")} />
                            </div>
                        </div>

                        {/* Missed Note Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="missedNote">Missed Note / Reflections</Label>
                            <Textarea
                                id="missedNote"
                                placeholder="Why was today different? Any learnings or missed goals..."
                                className="resize-none min-h-[80px]"
                                {...form.register("missedNote")}
                            />
                            {form.formState.errors.missedNote && (
                                <p className="text-[12px] text-destructive">{form.formState.errors.missedNote.message}</p>
                            )}
                        </div>

                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 border border-emerald-100 dark:border-emerald-500/20">
                            <div className="flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300">
                                <BookOpen className="h-4 w-4" />
                                <p>
                                    To update your today's reading or shlokas, go to{" "}
                                    <Link
                                        href="/books"
                                        className="font-bold underline underline-offset-2 hover:text-emerald-600 transition-colors"
                                    >
                                        My Bookshelf
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="ghost" type="button">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving</> : "Submit Sadhana"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}