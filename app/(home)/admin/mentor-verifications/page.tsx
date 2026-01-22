"use client"; // Note: We switch to client-side for immediate search responsiveness

import { useState, useEffect } from "react";
import { getPendingApplications } from "@/app/actions/mentorship";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Ensure you have this shadcn component
import { ShieldCheck, Flame, Search, UserSearch } from "lucide-react";
import { MentorActionButtons } from "./MentorActionButtons";

export default function VerifyMentorsPage() {
    const [applications, setApplications] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        async function loadData() {
            const { data, error } = await getPendingApplications();
            if (error) setError("Error loading applications");
            else setApplications(data || []);
            setIsLoading(false);
        }
        loadData();
    }, []);

    // Logic to filter by Name or User ID
    const filteredApplications = applications.filter((app) => {
        const query = searchQuery.toLowerCase();
        return (
            app.user.name.toLowerCase().includes(query) ||
            app.userId.toLowerCase().includes(query) ||
            app.user.email.toLowerCase().includes(query)
        );
    });

    if (isLoading) return <div className="p-10 text-center animate-pulse">Loading Applications...</div>;
    if (error) return <div className="p-10 text-center text-destructive">{error}</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight">Mentor Verification</h1>
                    <p className="text-muted-foreground">Approve or reject applications for mentorship status.</p>
                </div>

                {/* SEARCH BAR */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Name, Email or ID..."
                        className="pl-9 bg-card border-none rounded-xl h-11 focus-visible:ring-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {filteredApplications.length === 0 ? (
                    <Card className="p-20 text-center border-dashed bg-muted/20">
                        <UserSearch className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            {searchQuery ? `No results found for "${searchQuery}"` : "No pending applications at the moment."}
                        </p>
                    </Card>
                ) : (
                    filteredApplications.map((app) => (
                        <Card key={app.id} className="overflow-hidden border-none shadow-sm bg-card hover:shadow-md transition-all">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    {/* Profile Info Section */}
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="relative">
                                            <Avatar className="h-16 w-16 border-2 border-primary/10">
                                                <AvatarImage src={app.user.profileImage || ""} />
                                                <AvatarFallback className="font-bold text-xl">{app.user.name[0]}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-lg">{app.user.name}</h3>
                                                {app.user.isInitiated && <ShieldCheck size={16} className="text-primary" />}
                                            </div>
                                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">ID: {app.userId}</p>
                                            <p className="text-sm text-muted-foreground">{app.user.email}</p>
                                            <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider mt-1">
                                                <span className="text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                                                    {app.user.templeName || "General Sangha"}
                                                </span>
                                                <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                                    <Flame size={10} fill="currentColor" /> {app.user.currentStreak}d Streak
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACTION BUTTONS */}
                                    <MentorActionButtons userId={app.userId} appId={app.id} />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}