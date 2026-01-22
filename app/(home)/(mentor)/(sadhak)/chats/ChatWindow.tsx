"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Send, RefreshCw, ArrowLeft, MoreVertical, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMessages, sendMessage } from "@/app/actions/chat";
import { MessageData } from "@/types/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
    recipient: { id: string; name: string; image?: string | null };
    currentUserId: string;
    onBack: () => void;
}

export function ChatWindow({ recipient, currentUserId, onBack }: ChatWindowProps) {
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isFetching, setIsFetching] = useState(false);
    const [isSending, startTransition] = useTransition();
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        setIsFetching(true);
        const { data, error } = await getMessages(recipient.id);
        if (data) {
            setMessages(data);
            // Smooth scroll to bottom after data loads
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
        if (error) toast.error(error);
        setIsFetching(false);
    };

    // Load messages when recipient changes
    useEffect(() => {
        fetchMessages();
    }, [recipient.id]);

    const handleSend = () => {
        if (!newMessage.trim()) return;

        startTransition(async () => {
            const res = await sendMessage(recipient.id, newMessage.trim());
            if (res.success) {
                setNewMessage("");
                fetchMessages(); // Refresh list to show new message
            } else {
                toast.error("Failed to send message");
            }
        });
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#f0f2f5] dark:bg-background shadow-inner">
            {/* --- HEADER --- */}
            <header className="h-16 flex items-center justify-between px-4 bg-background border-b z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={recipient.image || ""} />
                        <AvatarFallback>{recipient.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-bold text-sm leading-tight">{recipient.name}</h2>
                        <p className="text-[10px] text-green-500 font-medium tracking-wide">ONLINE</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={fetchMessages} disabled={isFetching}>
                        <RefreshCw className={cn("w-5 h-5 opacity-70", isFetching && "animate-spin")} />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5 opacity-70" />
                    </Button>
                </div>
            </header>

            {/* --- MESSAGE CANVAS --- */}
            <ScrollArea className="flex-1 bg-[url('/bg-chat-light.png')] dark:bg-[url('/bg-chat-dark.png')] bg-repeat">
                {/* Ensure the container is flex-col and w-full. 
        Items start at the edges of 'max-w-4xl' 
    */}
                <div className="max-w-4xl mx-auto w-full p-4 md:p-6 flex flex-col gap-3">
                    {messages.map((msg, index) => {
                        const isMe = String(msg.senderId) === String(currentUserId);

                        return (
                            <div
                                key={msg.id || index}
                                // 'justify-end' pushes to right, 'justify-start' to left
                                className={cn(
                                    "flex w-full mb-1",
                                    isMe ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "relative max-w-[85%] md:max-w-[70%] px-4 py-2 shadow-sm",
                                        isMe
                                            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none ml-12" // ml-12 ensures space on left for "my" messages
                                            : "bg-background text-foreground rounded-2xl rounded-tl-none mr-12 border border-border/40" // mr-12 ensures space on right for "their" messages
                                    )}
                                >
                                    {/* Message Content */}
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </p>

                                    {/* Metadata (Time & Status) */}
                                    <div
                                        className={cn(
                                            "flex items-center gap-1.5 mt-1 justify-end text-[10px] select-none",
                                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                        )}
                                    >
                                        <span>
                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>

                                        {isMe && (
                                            <span className={msg.isRead ? "text-sky-300" : ""}>
                                                {msg.isRead ? "✓✓" : "✓"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {/* Scroll Anchor */}
                    <div ref={scrollRef} className="h-2" />
                </div>
            </ScrollArea>

            {/* --- INPUT BAR --- */}
            <footer className="p-4 bg-background border-t">
                <div className="max-w-3xl mx-auto flex items-end gap-2">
                    <div className="flex-1 bg-muted rounded-2xl flex items-end p-2 px-3 gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Smile className="w-5 h-5 opacity-60" />
                        </Button>
                        <textarea
                            rows={1}
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-1.5 text-sm max-h-32 outline-none"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Paperclip className="w-5 h-5 opacity-60" />
                        </Button>
                    </div>
                    <Button
                        onClick={handleSend}
                        disabled={isSending || !newMessage.trim()}
                        className="rounded-full h-11 w-11 shrink-0 p-0 shadow-lg"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </footer>
        </div>
    );
}