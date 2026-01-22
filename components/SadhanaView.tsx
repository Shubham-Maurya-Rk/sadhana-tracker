"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Flame, Zap, BookOpen, ScrollText,
    CheckCircle2, MapPin, Clock, Trophy,
    BookOpenTextIcon
} from "lucide-react";
import { format, isSameDay } from "date-fns";

export default function SadhanaView({ user }: { user: any }) {
    const [metric, setMetric] = useState("chanting");

    // --- HEATMAP LOGIC ---
    // Returns a map of date strings to intensity levels (0-4)
    const heatmapData = useMemo(() => {
        const data: Record<string, number> = {};
        user.sadhanaLogs?.forEach((log: any) => {
            let current = 0;
            let goal = 1;

            if (metric === "chanting") {
                current = log.chantingRounds;
                goal = user.roundsGoal;
            } else if (metric === "reading") {
                current = log.totalRead;
                goal = user.readingGoal;
            } else if (metric === "hearing") { // New logic
                current = log.hearingMinutes || 0;
                goal = user.hearingGoal || 1;
            } else if (metric === "aarti") {
                current = [log.mangalAarti, log.darshanAarti, log.bhogaAarti, log.gauraAarti].filter(Boolean).length;
                goal = user.aartisGoal;
            }

            const ratio = current / goal;
            let level = 0;
            if (current > 0) {
                if (ratio < 0.5) level = 1;
                else if (ratio < 1) level = 2;
                else if (ratio === 1) level = 3;
                else level = 4;
            }

            const dateKey = new Date(log.date).toDateString(); // Ensure this matches your date format
            data[dateKey] = level;
        });
        return data;
    }, [user.sadhanaLogs, metric, user.roundsGoal, user.readingGoal, user.hearingGoal, user.aartisGoal]);

    return (
        <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* --- HERO SECTION --- */}
            <section className="flex flex-col items-center text-center pt-10 px-6">
                <div className="relative group">
                    <Avatar className="h-32 w-32 border-8 border-primary/5 shadow-2xl transition-transform group-hover:scale-105">
                        <AvatarImage src={user.profileImage} className="object-cover" />
                        <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    {user.isInitiated && (
                        <div className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full border-4 border-background shadow-lg">
                            <Trophy size={18} fill="currentColor" />
                        </div>
                    )}
                </div>
                <h2 className="mt-4 text-4xl font-black italic tracking-tighter text-primary uppercase">{user.name}</h2>
                <p className="flex items-center gap-1 text-muted-foreground font-bold text-sm mt-1">
                    <MapPin size={14} className="text-primary" /> {user.templeName || "International Sangha"}
                </p>
            </section>

            {/* --- STATS SUMMARY --- */}
            <div className="grid grid-cols-2 gap-4 px-4">
                <Card className="p-6 rounded-[2.5rem] border-none bg-orange-50 dark:bg-orange-950/20 flex flex-col items-center">
                    <Flame className="text-orange-600 mb-1" size={28} fill="currentColor" />
                    <span className="text-3xl font-black text-orange-600 italic">{user.currentStreak}d</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Current Streak</span>
                </Card>
                <Card className="p-6 rounded-[2.5rem] border-none bg-primary/5 flex flex-col items-center">
                    <Zap className="text-primary mb-1" size={28} fill="currentColor" />
                    <span className="text-3xl font-black text-primary italic">{user.highestStreak}d</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Highest Streak</span>
                </Card>
            </div>

            {/* --- CALENDAR HEATMAP SECTION --- */}
            <section className="px-4 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black uppercase tracking-tighter italic">Discipline Heatmap</h3>
                    <Tabs value={metric} onValueChange={setMetric} className="w-auto">
                        <TabsList className="bg-muted/40 rounded-xl h-8 p-1">
                            <TabsTrigger value="chanting" className="text-[9px] font-black uppercase px-3">Japa</TabsTrigger>
                            <TabsTrigger value="reading" className="text-[9px] font-black uppercase px-3">Read</TabsTrigger>
                            <TabsTrigger value="hearing" className="text-[9px] font-black uppercase px-3">Hear</TabsTrigger>
                            <TabsTrigger value="aarti" className="text-[9px] font-black uppercase px-3">Aarti</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <Card className="p-4 rounded-[2.5rem] border-none shadow-inner bg-muted/20 flex flex-col items-center">
                    <Calendar
                        mode="single"
                        className="p-0"
                        classNames={{
                            months: "flex flex-col",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center mb-2",
                            caption_label: "text-sm font-black uppercase tracking-widest text-primary",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex mb-2",
                            head_cell: "text-muted-foreground rounded-md w-9 font-black text-[10px] uppercase tracking-tighter",
                            row: "flex w-full mt-1",
                        }}
                        components={{
                            Day: ({ day, ...props }) => {
                                const dateKey = day.date.toDateString();
                                const level = heatmapData[dateKey] || 0;
                                const isOutside = props.modifiers?.outside;

                                // Level 0: Missed/None
                                // Level 1-2: Partial (Light Colors)
                                // Level 3-4: Goal Met/Exceeded (Solid + Effects)
                                const levelStyles = [
                                    "bg-background/40 text-muted-foreground border-transparent",
                                    "bg-primary/10 text-primary border-transparent",
                                    "bg-primary/30 text-primary border-transparent font-bold",
                                    // GOAL MET: Solid background + subtle shadow
                                    "bg-primary text-primary-foreground font-black shadow-[0_0_10px_rgba(var(--primary),0.2)] border-primary",
                                    // EXCEEDED: Solid background + ring + scale
                                    "bg-primary dark:bg-primary/90 text-primary-foreground font-black shadow-lg ring-2 ring-primary/30 scale-105 z-10 border-primary"
                                ];

                                return (
                                    <td
                                        className={`
                                relative h-9 w-9 p-0 flex items-center justify-center text-[10px] transition-all rounded-xl border-2
                                ${isOutside ? "opacity-10 pointer-events-none" : "opacity-100"}
                                ${levelStyles[level]}
                            `}
                                    >
                                        {day.date.getDate()}
                                        {/* Optional: Add a tiny dot for 'Exceeded' days */}
                                        {level === 4 && (
                                            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                            </span>
                                        )}
                                    </td>
                                );
                            },
                        }}
                    />

                    {/* Updated Legend to show differentiation */}
                    <div className="mt-6 flex flex-col items-center gap-3 border-t border-muted-foreground/5 pt-4 w-full">
                        <div className="flex gap-3 items-center justify-center">
                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Partial</span>
                            <div className="flex gap-1">
                                <div className="h-3 w-3 rounded-[3px] bg-primary/10" />
                                <div className="h-3 w-3 rounded-[3px] bg-primary/30" />
                            </div>
                            <div className="h-4 w-[1px] bg-muted mx-1" />
                            <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Goal Met</span>
                            <div className="flex gap-1">
                                <div className="h-3 w-3 rounded-[3px] bg-primary" />
                                <div className="h-3 w-3 rounded-[3px] bg-primary ring-1 ring-primary/50" />
                            </div>
                        </div>
                    </div>
                </Card>
            </section>

            {/* --- RECENT BOOKS --- */}
            <section className="px-4 space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <BookOpen size={18} className="text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-tighter italic">Recent Reading</h3>
                </div>
                <div className="grid gap-3">
                    {user.bookProgressions && user.bookProgressions.length > 0 ? (
                        user.bookProgressions.map((bp: any) => (
                            <Card key={bp.id} className="p-5 rounded-[2rem] border-muted/30 bg-card shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="min-w-0">
                                        <h4 className="font-black text-primary italic truncate">{bp.book.title}</h4>
                                        <p className="text-[10px] font-bold text-muted-foreground mt-1 flex items-center gap-1">
                                            <Clock size={10} /> Last activity: {bp.lastReadDate ? format(new Date(bp.lastReadDate), "MMM dd") : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full">
                                        {Math.round((bp.currentValue / bp.totalUnits) * 100)}%
                                    </div>
                                </div>
                                <Progress value={(bp.currentValue / bp.totalUnits) * 100} className="h-2 rounded-full" />
                            </Card>
                        ))
                    ) : (
                        /* --- EMPTY STATE START --- */
                        <Card className="p-10 rounded-[2rem] border-dashed border-2 border-muted/20 bg-transparent flex flex-col items-center justify-center text-center">
                            <div className="bg-muted/10 p-4 rounded-full mb-4">
                                <BookOpenTextIcon className="text-muted-foreground/40" size={32} />
                            </div>
                            <h4 className="font-black text-sm text-muted-foreground italic uppercase tracking-widest">
                                No Active Books
                            </h4>
                            <p className="text-[11px] text-muted-foreground/60 mt-2 max-w-[200px] font-medium">
                                "Knowledge is the torch that illuminates the path of Sadhana."
                            </p>
                        </Card>
                        /* --- EMPTY STATE END --- */
                    )}
                </div>
            </section>

            {/* --- RECENT SHLOKAS --- */}
            <section className="px-4 space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <ScrollText size={18} className="text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-tighter italic">Learned Shlokas (Last 10)</h3>
                </div>
                <div className="grid gap-3">
                    {user.recentShlokas?.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-4 p-4 rounded-3xl bg-muted/30 border border-muted/50 group hover:border-primary/20 transition-all">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={18} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                    <h4 className="font-bold text-sm text-foreground italic">{s.reference}</h4>
                                    <span className="text-[9px] font-black text-muted-foreground uppercase">{format(new Date(s.updatedAt), "MMM dd")}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{s.challengeTitle}</p>
                            </div>
                        </div>
                    ))}
                    {user.recentShlokas?.length === 0 && (
                        <p className="text-center text-xs font-bold text-muted-foreground italic py-4">No shlokas learned yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
}