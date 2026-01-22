"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Target, Flame, BookOpen, Headphones, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import SadhanaDashboard from "./SadhanaDashboard";

export function MentorSadhakaStats({ user, viewDate }: { user: any; viewDate: Date }) {
    const [metric, setMetric] = useState("chanting");

    const getLogData = (date: Date) => {
        return user.sadhanaLogs?.find(
            (l: any) => new Date(l.date).toDateString() === date.toDateString()
        );
    };

    return (
        <div className="space-y-8">
            {/* 1. Header & Metric Selector */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center md:text-left">
                    <h3 className="font-black italic uppercase text-2xl tracking-tighter text-primary leading-none">
                        Sadhana Intensity
                    </h3>
                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">Visualizing Consistency</p>
                </div>

                <Tabs value={metric} onValueChange={setMetric} className="w-full sm:w-auto">
                    <TabsList className="grid grid-cols-4 w-full sm:w-[400px] bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl h-12 p-1 border border-zinc-200 dark:border-zinc-700">
                        {["chanting", "reading", "hearing", "aarti"].map((m) => (
                            <TabsTrigger
                                key={m}
                                value={m}
                                className="text-[10px] font-black uppercase italic data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all duration-300"
                            >
                                {m}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* 2. Main Heatmap Section */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-zinc-950 rounded-[3rem] p-6 sm:p-10 border shadow-2xl flex justify-center overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[100px] rounded-full" />

                        <Calendar
                            mode="single"
                            month={viewDate}
                            disableNavigation
                            className="p-0 border-none"
                            classNames={{
                                months: "w-full",
                                month: "space-y-6",
                                head_row: "flex w-full justify-between px-2",
                                head_cell: "text-muted-foreground w-10 sm:w-14 font-black text-[11px] uppercase tracking-widest",
                                row: "flex w-full mt-2 gap-2",
                                // Critical fix: Ensure cell doesn't add extra padding
                                cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
                                // Remove default day styling to allow our custom div to shine
                                day: "h-auto w-auto p-0 font-normal aria-selected:opacity-100",
                            }}
                            components={{
                                // Override the Button (DayButton) component to avoid the <tr><div> nesting error
                                DayButton: ({ day, modifiers, ...props }) => {
                                    const log = getLogData(day.date);
                                    let isGoalMet = false;
                                    let intensity = "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 border border-zinc-100 dark:border-zinc-800/50";
                                    let displayVal = 0;

                                    if (log) {
                                        if (metric === "chanting") {
                                            displayVal = log.chantingRounds;
                                            isGoalMet = displayVal >= user.roundsGoal;
                                        } else if (metric === "reading") {
                                            displayVal = log.totalRead;
                                            isGoalMet = displayVal >= user.readingGoal;
                                        } else if (metric === "hearing") {
                                            displayVal = log.lectureDuration;
                                            isGoalMet = displayVal >= user.hearingGoal;
                                        } else if (metric === "aarti") {
                                            displayVal = [log.mangalAarti, log.darshanAarti, log.bhogaAarti, log.gauraAarti].filter(Boolean).length;
                                            isGoalMet = displayVal >= user.aartisGoal;
                                        }

                                        if (displayVal > 0) {
                                            intensity = isGoalMet
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                : "bg-primary/15 text-primary border-primary/20";
                                        }
                                    }

                                    return (
                                        <button
                                            {...props}
                                            type="button"
                                            className={`
                                                relative h-12 w-12 sm:h-14 sm:w-14 rounded-[1.25rem] flex flex-col items-center justify-center transition-all duration-500
                                                ${modifiers?.outside ? "opacity-0 pointer-events-none" : "opacity-100"}
                                                ${intensity}
                                                ${isGoalMet ? "scale-105 z-10" : "hover:scale-105"}
                                                outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                                            `}
                                        >
                                            {/* Date - Top Right */}
                                            <span className={`absolute top-1.5 right-2 text-[8px] font-black uppercase ${isGoalMet ? "text-white/60" : "opacity-60 text-zinc-500"}`}>
                                                {day.date.getDate()}
                                            </span>

                                            {/* Count - Center */}
                                            {displayVal > 0 && (
                                                <span className={`text-sm sm:text-base font-black italic tracking-tighter leading-none`}>
                                                    {displayVal}
                                                </span>
                                            )}

                                            {/* Star Badge - Top Left */}
                                            {isGoalMet && (
                                                <div className="absolute top-1.5 left-2">
                                                    <Star size={10} className="fill-yellow-400 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                }
                            }}
                        />
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-6 px-4">
                        <LegendItem color="bg-zinc-100 dark:bg-zinc-800" label="Zero Activity" />
                        <LegendItem color="bg-primary/20" label="Partial Progress" />
                        <LegendItem color="bg-primary" label="Goal Achieved" />
                    </div>
                    <SadhanaDashboard
                        data={user.sadhanaLogs}
                        activeMetric={metric}
                    />
                </div>

                {/* 3. User Goals Dashboard */}
                <div className="space-y-4">
                    <h4 className="font-black italic uppercase text-xs tracking-[0.3em] text-muted-foreground ml-2 mb-4">Set Targets</h4>
                    <GoalCard icon={<Flame size={14} />} label="Japa Rounds" value={user.roundsGoal} sub="Daily" color="text-orange-500" />
                    <GoalCard icon={<BookOpen size={14} />} label="Reading" value={user.readingGoal} sub="Pages" color="text-blue-500" />
                    <GoalCard icon={<Headphones size={14} />} label="Hearing" value={user.hearingGoal} sub="Mins" color="text-purple-500" />
                    <GoalCard icon={<Zap size={14} />} label="Aartis" value={user.aartisGoal} sub="Total" color="text-yellow-500" />

                    <Card className="mt-6 p-6 bg-primary text-white rounded-[2.5rem] border-none shadow-xl shadow-primary/20 flex flex-col items-center justify-center text-center space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">All-Time Best</span>
                        <div className="text-4xl font-black italic tracking-tighter leading-none">{user.highestStreak}D</div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Streak Mastered</span>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-md ${color} border border-zinc-200 dark:border-zinc-700 shadow-sm`} />
            <span className="text-[10px] font-black uppercase italic opacity-60 tracking-tighter">{label}</span>
        </div>
    );
}

function GoalCard({ icon, label, value, sub, color }: any) {
    return (
        <Card className="bg-white dark:bg-zinc-900 border-none shadow-sm rounded-[1.8rem] p-5 flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 ${color} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                    <span className="text-[10px] font-bold opacity-40 uppercase italic leading-none">{sub}</span>
                </div>
            </div>
            <div className="text-2xl font-black italic tracking-tighter text-zinc-900 dark:text-white">
                {value}
            </div>
        </Card>
    );
}