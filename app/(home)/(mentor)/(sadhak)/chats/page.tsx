"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, MessageSquare, Ghost, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "./ChatWindow";
import { getConversations } from "@/app/actions/chat";
import { ConversationData } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


export default function MentorChatPage() {
    const searchParams = useSearchParams();
    const openId = searchParams.get("open");

    const [conversations, setConversations] = useState<ConversationData[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<ConversationData | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        // We pass openId to the server action to handle "New Chat" logic
        const { data, userId: authId, error } = await getConversations(openId);

        if (error) {
            console.error("Load error:", error);
        } else {
            if (authId) setUserId(authId);
            if (data) {
                setConversations(data);

                if (openId) {
                    const target = data.find(c => String(c.id) === String(openId));
                    if (target) setSelectedRecipient(target);
                }
            }
        }
        setIsLoading(false);
    }, [openId]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading && !userId) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary opacity-50" />
                    <p className="text-xs font-medium text-muted-foreground animate-pulse">Establishing Connection...</p>
                </div>
            </div>
        );
    }

    return (
        /** * FIX: Added 'isolate' and fixed h-[calc(100vh-64px)] 
         * Ensure this matches your Navbar height exactly. 
         * 'overflow-hidden' prevents the window from jumping.
         */
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background isolate relative">

            {/* --- LEFT SIDEBAR: CONVERSATION LIST --- */}
            <aside className={cn(
                "flex-col w-full md:w-[350px] lg:w-[400px] border-r bg-card transition-all relative z-10",
                selectedRecipient ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b space-y-4 bg-background/95 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="space-y-0.5">
                                <h1 className="text-xl font-bold tracking-tight">Messages</h1>
                                <p className="text-[10px] uppercase font-bold text-primary/60 tracking-widest">Chats Dashboard</p>
                            </div>

                            {/* Info Popover for New Chats */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground mt-0.5">
                                        <Info className="w-3.5 h-3.5" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    side="bottom"
                                    align="start"
                                    className="w-72 p-4 rounded-2xl shadow-premium border-none bg-card"
                                >
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-sm flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            How to start a chat?
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            To start a new chat, visit your <span className="text-foreground font-medium">Watching Users</span> section in Friends or browse the <span className="text-foreground font-medium">Group Members</span> list (available for Mentors).
                                            Simply click on send message to initiate a conversation.
                                        </p>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={loadInitialData}
                            disabled={isLoading}
                            className="rounded-full hover:bg-primary/10 transition-all active:scale-90"
                        >
                            <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isLoading && "animate-spin")} />
                        </Button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                            placeholder="Search Sadhakas..."
                            className="pl-9 bg-muted/50 border-none rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {filteredConversations.length > 0 ? (
                            filteredConversations.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => setSelectedRecipient(chat)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                                        selectedRecipient?.id === chat.id
                                            ? "bg-primary text-primary-foreground shadow-md scale-[0.98]"
                                            : "hover:bg-muted active:scale-[0.97]"
                                    )}
                                >
                                    <div className="relative">
                                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                            <AvatarImage src={chat.image || ""} />
                                            <AvatarFallback className="bg-muted text-foreground font-bold">{chat.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                    </div>

                                    <div className="flex-1 text-left overflow-hidden">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className="font-bold text-sm truncate">{chat.name}</p>
                                            <span className="text-[10px] opacity-70 font-medium">{chat.lastMessageTime}</span>
                                        </div>
                                        <p className={cn(
                                            "text-xs truncate opacity-80",
                                            selectedRecipient?.id === chat.id ? "text-primary-foreground" : "text-muted-foreground"
                                        )}>
                                            {chat.lastMessage}
                                        </p>
                                    </div>

                                    {chat.unreadCount > 0 && selectedRecipient?.id !== chat.id && (
                                        <div className="bg-orange-500 text-white text-[10px] min-w-[20px] h-[20px] flex items-center justify-center rounded-full font-black px-1 shadow-sm">
                                            {chat.unreadCount}
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                <Ghost className="w-10 h-10 text-muted-foreground/20 mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">No conversations found</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </aside>

            {/* --- RIGHT SIDEBAR: CHAT WINDOW --- */}
            <main className={cn(
                "flex-1 flex flex-col bg-muted/20 relative h-full overflow-hidden", // Added h-full and overflow-hidden
                !selectedRecipient ? "hidden md:flex" : "flex"
            )}>
                {selectedRecipient ? (
                    <ChatWindow
                        recipient={selectedRecipient}
                        currentUserId={userId!}
                        onBack={() => setSelectedRecipient(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-6">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl animate-pulse" />
                            <div className="relative w-24 h-24 bg-background rounded-full flex items-center justify-center border shadow-xl">
                                <MessageSquare className="w-10 h-10 text-primary/20" />
                            </div>
                        </div>
                        <div className="max-w-xs space-y-2">
                            <h3 className="text-xl font-bold text-foreground">Sadhaka Guidance</h3>
                            <p className="text-sm leading-relaxed">
                                Select a devotee from the list to view their progress and provide guidance.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}