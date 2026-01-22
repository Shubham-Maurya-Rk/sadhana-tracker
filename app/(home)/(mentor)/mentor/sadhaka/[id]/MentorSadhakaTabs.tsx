"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Flame, GraduationCap, CheckCircle2, Library,
    ChevronRight, Clock, Trophy, BookOpen, ScrollText
} from "lucide-react";
import { MentorSadhakaStats } from "./MentorSadhakaStats";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

export function MentorSadhakaTabs({ user, viewDate }: { user: any; viewDate: Date }) {

    const formatTimeSafe = (dateValue: any) => {
        if (!dateValue) return "No activity";
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "Invalid date";
        return `Active ${formatDistanceToNow(date)} ago`;
    };

    // --- REUSABLE EMPTY STATE COMPONENT ---
    const EmptyState = ({ icon: Icon, title, description }: any) => (
        <div className="col-span-full flex flex-col items-center justify-center py-20 px-6 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-xl mb-4 text-primary">
                <Icon size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-zinc-400">{title}</h3>
            <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">{description}</p>
        </div>
    );

    return (
        <Tabs defaultValue="sadhana" className="w-full">
            <TabsList className="flex w-full overflow-x-auto justify-start bg-transparent h-14 p-0 no-scrollbar mb-8 gap-4">
                {["sadhana", "books", "shlokas"].map((tab) => (
                    <TabsTrigger key={tab} value={tab} className="flex-shrink-0 px-8 rounded-full font-black uppercase text-xs italic tracking-tighter h-12 data-[state=active]:bg-primary data-[state=active]:text-white border border-transparent data-[state=active]:shadow-xl transition-all">
                        {tab === 'sadhana' && <Flame size={16} className="mr-2" />}
                        {tab === 'books' && <Library size={16} className="mr-2" />}
                        {tab === 'shlokas' && <GraduationCap size={16} className="mr-2" />}
                        {tab}
                    </TabsTrigger>
                ))}
            </TabsList>

            {/* SADHANA HEATMAP TAB */}
            <TabsContent value="sadhana" className="outline-none">
                <MentorSadhakaStats user={user} viewDate={viewDate} />
            </TabsContent>

            {/* BOOKS PROGRESS TAB */}
            <TabsContent value="books" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 outline-none">
                {user.bookProgressions && user.bookProgressions.length > 0 ? (
                    user.bookProgressions.map((bp: any) => {
                        const pct = Math.round((bp.currentValue / bp.totalUnits) * 100);
                        return (
                            <Card key={bp.id} className="p-8 rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-2">
                                        <Badge className="bg-orange-100 dark:bg-orange-950/30 text-orange-600 font-black italic text-[10px] uppercase rounded-lg px-3">
                                            <Flame size={12} fill="currentColor" className="mr-1" /> {bp.currentStreak}D STREAK
                                        </Badge>
                                        <div className="flex items-center text-[9px] font-black uppercase text-muted-foreground tracking-tighter ml-1">
                                            <Clock size={10} className="mr-1" />
                                            {formatTimeSafe(bp.lastReadDate)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black italic text-primary/10 block leading-none">#{bp.id.slice(-2)}</span>
                                        <div className="flex items-center text-[9px] font-black text-yellow-600 uppercase mt-1">
                                            <Trophy size={10} className="mr-1" /> {bp.highestStreak}D MAX
                                        </div>
                                    </div>
                                </div>

                                <h4 className="font-black italic uppercase text-xl tracking-tighter leading-none mb-2 text-zinc-900 dark:text-white">
                                    {bp.book?.title || "Untitled Book"}
                                </h4>
                                <Progress value={pct} className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4" />

                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span>{bp.currentValue} Units</span>
                                    <span className="text-primary font-bold">{pct}% Completed</span>
                                </div>
                            </Card>
                        );
                    })
                ) : (
                    <EmptyState
                        icon={BookOpen}
                        title="No Shastra Activity"
                        description="This Sadhaka hasn't started reading any books yet."
                    />
                )}
            </TabsContent>

            {/* SHLOKAS TAB */}
            <TabsContent value="shlokas" className="space-y-10 outline-none">
                {user.shlokaChallenges && user.shlokaChallenges.length > 0 ? (
                    user.shlokaChallenges.map((challenge: any) => (
                        <div key={challenge.id} className="space-y-6">
                            {/* ... (rest of your existing shloka mapping logic) */}
                            <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-[2.5rem]">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black italic shadow-lg shadow-primary/30 text-xl">
                                        {challenge.title[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{challenge.title}</h3>
                                        {/* ... (Existing streak/clock display) */}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {challenge.shlokas.map((s: any) => (
                                    <div key={s.id} className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-primary/20 shadow-sm flex items-center justify-between group transition-all">
                                        {/* ... (Existing individual shloka card) */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState
                        icon={ScrollText}
                        title="No Shlokas Memorized"
                        description="Memorization challenges will appear here once started."
                    />
                )}
            </TabsContent>
        </Tabs>
    );
}