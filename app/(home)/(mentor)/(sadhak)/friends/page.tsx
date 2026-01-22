"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    Flame, CheckCircle2, UserPlus, Users, Bell,
    MapPin, X, Search, Zap, ShieldCheck, Loader2, UserMinus, ShieldOff,
    MessageCircle
} from "lucide-react";
import {
    getSocialData,
    sendTrackRequest,
    handleRequest,
    removeAuthority,
    stopTracking
} from "@/app/actions/friend";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SanghaPage() {
    const [data, setData] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();

    const fetchAll = async () => {
        try {
            const res = await getSocialData();
            if (res.error) {
                toast.error(res.error);
            } else {
                setData(res);
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const filteredData = useMemo(() => {
        if (!data) return null;
        const query = searchQuery.toLowerCase().trim();

        // Updated filter logic to include ID search
        const filterUser = (u: any) =>
            u.name?.toLowerCase().includes(query) ||
            u.templeName?.toLowerCase().includes(query) ||
            u.id?.toLowerCase() === query; // Exact ID match

        return {
            tracking: data.tracking?.filter(filterUser) || [],
            followers: data.followers?.filter(filterUser) || [],
            pending: data.pending?.filter((p: any) => filterUser(p.user)) || [],
            explore: data.explore?.filter(filterUser) || [],
        };
    }, [data, searchQuery]);

    if (!data) {
        return (
            <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
                <p className="text-muted-foreground font-bold animate-pulse">Entering the Sangha...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 pb-24 space-y-6">
            <header className="py-4 text-center">
                <h1 className="text-4xl font-black tracking-tighter text-primary italic uppercase">SANGHA</h1>
                <p className="text-muted-foreground font-medium italic">Grow together in your spiritual journey</p>
            </header>

            {/* --- SEARCH BAR --- */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Search by name, temple, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 pr-4 rounded-3xl border-none bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-base shadow-inner"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <X size={16} className="text-muted-foreground" />
                    </button>
                )}
            </div>

            <Tabs defaultValue="tracking" className="w-full">
                {/* --- UPDATED TAB HEADINGS --- */}
                <TabsList className="grid w-full grid-cols-3 bg-muted/40 p-1 rounded-3xl h-16 border border-border/50 shadow-inner">
                    <TabsTrigger value="tracking" className="rounded-2xl font-bold transition-all data-[state=active]:shadow-md">
                        Watching
                    </TabsTrigger>
                    <TabsTrigger value="followers" className="rounded-2xl font-bold relative transition-all data-[state=active]:shadow-md">
                        Watched By
                        {(data?.pending?.length ?? 0) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] text-white animate-bounce border-2 border-background font-black">
                                {data.pending.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="explore" className="rounded-2xl font-bold transition-all data-[state=active]:shadow-md">
                        Discover
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: WATCHING (Formerly Tracking) */}
                <TabsContent value="tracking" className="mt-6 space-y-4 outline-none">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Sadhakas I Observe</h3>
                        <Zap size={14} className="text-primary" />
                    </div>
                    {filteredData?.tracking.length === 0 ? (
                        <EmptyState
                            icon={<Users size={40} className="opacity-20" />}
                            msg={searchQuery ? "No matching Sadhakas" : "You aren't watching anyone yet."}
                            sub="Find peers to track their daily progress."
                        />
                    ) : (
                        filteredData?.tracking.map((u: any) => (
                            <UserCard
                                key={u.id}
                                user={u}
                                variant="active_tracking"
                                onAction={() => {
                                    startTransition(async () => {
                                        const res = await stopTracking(u.id);
                                        if (res.success) {
                                            toast.success(res.message || "Stopped tracking");
                                            fetchAll();
                                        } else {
                                            toast.error(res.error);
                                        }
                                    });
                                }}
                            />
                        ))
                    )}
                </TabsContent>

                {/* TAB 2: WATCHED BY (Formerly Followers) */}
                <TabsContent value="followers" className="mt-6 space-y-8 outline-none">
                    {filteredData?.pending && filteredData.pending.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <Bell size={14} className="text-orange-600 animate-pulse" />
                                <h3 className="text-xs font-black uppercase text-orange-600 tracking-widest">New Requests</h3>
                            </div>
                            {filteredData.pending.map((item: any) => (
                                <UserCard
                                    key={item.connectionId}
                                    user={item.user}
                                    variant="pending"
                                    onAccept={() => startTransition(() => handleRequest(item.connectionId, "ACCEPTED").then(fetchAll))}
                                    onReject={() => startTransition(() => handleRequest(item.connectionId, "REJECTED").then(fetchAll))}
                                />
                            ))}
                        </section>
                    )}

                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest px-2">My Observers</h3>
                        {filteredData?.followers.length === 0 ? (
                            <EmptyState
                                icon={<ShieldCheck size={40} className="opacity-20" />}
                                msg="No one is watching your progress."
                                sub="Share your ID with friends to let them monitor your journey."
                            />
                        ) : (
                            filteredData?.followers.map((u: any) => (
                                <UserCard
                                    key={u.id}
                                    user={u}
                                    variant="authority_management"
                                    onAction={() => {
                                        startTransition(async () => {
                                            const res = await removeAuthority(u.id);
                                            if (res.success) {
                                                toast.success(res.message || "Authority removed");
                                                fetchAll();
                                            } else {
                                                toast.error(res.error);
                                            }
                                        });
                                    }}
                                />
                            ))
                        )}
                    </section>
                </TabsContent>

                {/* TAB 3: DISCOVER (Formerly Explore) */}
                <TabsContent value="explore" className="mt-6 space-y-4 outline-none">
                    <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest px-2">Find Your Sangha</h3>
                    {filteredData?.explore.length === 0 ? (
                        <EmptyState
                            icon={<Search size={40} className="opacity-20" />}
                            msg={searchQuery ? "Search yielded no results" : "Looking for more Sadhakas..."}
                            sub="Try searching by a specific Temple name or User ID."
                        />
                    ) : (
                        filteredData?.explore.map((u: any) => {
                            const followsMe = data.followers?.some((f: any) => f.id === u.id);
                            return (
                                <UserCard
                                    key={u.id}
                                    user={{ ...u, followsMe }}
                                    variant="explore"
                                    onAction={() => startTransition(() => sendTrackRequest(u.id).then(fetchAll))}
                                />
                            );
                        })
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function UserCard({ user, variant, onAccept, onReject, onAction }: any) {
    const router = useRouter();

    const handleStartChat = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/chats?open=${user.id}`);
    };

    const copyId = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(user.id);
        toast.success("ID copied!");
    };

    const getExploreButton = () => {
        if (user.myRequestStatus === "PENDING") {
            return (
                <Button disabled className="rounded-2xl px-5 h-10 font-black gap-2 bg-muted text-muted-foreground opacity-70">
                    <Loader2 className="w-4 h-4 animate-spin" /> Sent
                </Button>
            );
        }
        if (user.myRequestStatus === "ACCEPTED") {
            return (
                <div className="flex gap-2">
                    <Button
                        size="icon"
                        onClick={handleStartChat}
                        className="rounded-full w-10 h-10 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                    >
                        <MessageCircle size={18} />
                    </Button>
                    <Button disabled className="rounded-2xl px-5 h-10 font-black gap-2 bg-primary/10 text-primary border border-primary/20">
                        <ShieldCheck size={16} /> Peer
                    </Button>
                </div>
            );
        }
        return (
            <Button
                size="sm"
                onClick={onAction}
                className="rounded-2xl px-5 h-10 font-black gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-none"
            >
                <UserPlus size={16} />
                {user.followsMe ? "Watch Back" : "Watch"}
            </Button>
        );
    };

    return (
        <Card className="p-4 rounded-[2rem] border-none shadow-sm bg-gradient-to-r from-card to-muted/20 hover:shadow-lg hover:to-muted/40 transition-all group overflow-hidden border border-border/10 mb-3">
            <div className="flex items-center justify-between gap-4">
                <Link href={`/sangha/${user.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative shrink-0">
                        <Avatar className="h-14 w-14 border-2 border-background ring-2 ring-primary/10 shadow-sm">
                            <AvatarImage src={user.profileImage} className="object-cover" />
                            <AvatarFallback className="bg-primary/5 text-primary font-black text-lg">
                                {user.name?.[0] || "?"}
                            </AvatarFallback>
                        </Avatar>
                        {user.isInitiated && (
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-background shadow-md">
                                <CheckCircle2 size={12} fill="currentColor" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-black text-base tracking-tight truncate group-hover:text-primary transition-colors flex items-center gap-2">
                            {user.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-bold">
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                                <MapPin size={10} className="text-primary" /> {user.templeName || "General Sangha"}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full ring-1 ring-orange-100 whitespace-nowrap">
                                <Flame size={10} fill="currentColor" /> {user.currentStreak}d
                            </span>
                            <span
                                onClick={copyId}
                                className="text-[9px] font-mono text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer"
                            >
                                ID: {user.id.slice(0, 8)}...
                            </span>
                        </div>
                    </div>
                </Link>

                <div className="shrink-0 flex items-center gap-2">
                    {(variant === "active_tracking" || variant === "authority_management") && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleStartChat}
                            className="rounded-full w-9 h-9 text-primary hover:bg-primary/10"
                        >
                            <MessageCircle size={18} />
                        </Button>
                    )}

                    {variant === "active_tracking" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onAction}
                            className="rounded-2xl font-black text-xs hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground flex gap-2 px-3"
                        >
                            <UserMinus size={14} /> <span className="hidden sm:inline">Stop</span>
                        </Button>
                    )}

                    {variant === "authority_management" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onAction}
                            className="rounded-2xl font-black text-xs hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground flex gap-2 px-3"
                        >
                            <ShieldOff size={14} /> <span className="hidden sm:inline">Remove</span>
                        </Button>
                    )}

                    {variant === "pending" && (
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={onReject} className="rounded-full w-10 h-10 text-destructive hover:bg-destructive/10">
                                <X size={20} />
                            </Button>
                            <Button size="sm" onClick={onAccept} className="rounded-2xl px-6 h-10 font-black shadow-md shadow-primary/20">
                                Accept
                            </Button>
                        </div>
                    )}

                    {variant === "explore" && getExploreButton()}
                </div>
            </div>
        </Card>
    );
}

function EmptyState({ icon, msg, sub }: { icon: React.ReactNode, msg: string, sub: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-[2.5rem] border-2 border-dashed border-muted bg-muted/5">
            <div className="mb-4 text-muted-foreground/40">{icon}</div>
            <p className="text-sm font-black text-foreground">{msg}</p>
            <p className="text-xs text-muted-foreground mt-2 max-w-[240px] leading-relaxed font-medium">
                {sub}
            </p>
        </div>
    );
}