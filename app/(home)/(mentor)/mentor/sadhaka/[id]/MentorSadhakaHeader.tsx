"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Flame, Trophy, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export function MentorSadhakaHeader({ user }: { user: any }) {
    const router = useRouter();

    return (
        <div className="bg-primary/5 border-b border-primary/10 pt-8 md:pt-12 pb-12">
            <div className="max-w-5xl mx-auto px-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    // Reduced margin on mobile
                    className="mb-4 md:mb-6 font-bold uppercase text-[10px] tracking-widest gap-2 -ml-2"
                >
                    <ChevronLeft size={14} /> Back to Group
                </Button>

                {/* Main container: column on mobile, row on desktop */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

                    {/* User Profile Section: items-center for mobile centering */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                        <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-xl shrink-0">
                            <AvatarImage src={user.profileImage} />
                            <AvatarFallback className="text-xl md:text-2xl font-black italic">{user.name?.[0]}</AvatarFallback>
                        </Avatar>

                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl md:text-4xl font-black italic uppercase text-primary tracking-tighter leading-tight">
                                {user.name}
                            </h1>
                            <p className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground font-bold text-xs uppercase tracking-wider mt-1">
                                <MapPin size={14} className="text-primary" />
                                {user.templeName || "International Sangha"}
                            </p>
                        </div>
                    </div>

                    {/* Stats Section: Full width grid on mobile, auto width on desktop */}
                    <div className="grid grid-cols-2 md:flex gap-4">
                        <div className="bg-orange-100 p-4 rounded-3xl flex flex-col items-center min-w-[100px] border border-orange-200/50">
                            <Flame className="text-orange-600 mb-1" size={20} fill="currentColor" />
                            <span className="text-xl font-black text-orange-600 italic leading-none">{user.currentStreak}d</span>
                            <span className="text-[8px] font-black uppercase text-orange-400 mt-1">Streak</span>
                        </div>
                        <div className="bg-primary/10 p-4 rounded-3xl flex flex-col items-center min-w-[100px] border border-primary/10">
                            <Trophy className="text-primary mb-1" size={20} fill="currentColor" />
                            <span className="text-xl font-black text-primary italic leading-none">{user.highestStreak}d</span>
                            <span className="text-[8px] font-black uppercase text-primary/40 mt-1">Best</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}