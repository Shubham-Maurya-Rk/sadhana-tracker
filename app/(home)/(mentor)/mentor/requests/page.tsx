"use client";

import { useState, useEffect, useTransition } from "react";
import { Check, X, UserPlus, Info, Flame, LayoutGrid } from "lucide-react";
import { getMentorshipRequests, handleRequestAction, getMentorGroups } from "@/app/actions/group";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();

    // States for the Accept Modal
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [targetGroupId, setTargetGroupId] = useState<string>("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [reqRes, groupRes] = await Promise.all([getMentorshipRequests(), getMentorGroups()]);
        if (reqRes.data) {
            setRequests(reqRes.data);
        }
        if (groupRes.data) setGroups(groupRes.data);
    }

    const onProcess = (requestId: string, action: "ACCEPT" | "REJECT") => {
        if (action === "ACCEPT") {
            const req = requests.find(r => r.id === requestId);
            setSelectedRequest(req);
            return;
        }

        startTransition(async () => {
            const res = await handleRequestAction(requestId, "REJECT");
            if (res.success) {
                toast.success("Request rejected");
                loadData();
            }
        });
    };

    const confirmAccept = () => {
        if (!targetGroupId) return toast.error("Select a group");

        startTransition(async () => {
            const res = await handleRequestAction(selectedRequest.id, "ACCEPT", targetGroupId);
            if (res.success) {
                toast.success(`${selectedRequest.sender.name} added to group!`);
                setSelectedRequest(null);
                setTargetGroupId("");
                loadData();
            }
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 md:space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
                        <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        Mentorship Requests
                    </h1>
                    <p className="text-muted-foreground text-xs md:text-sm">Sadhakas waiting for your guidance</p>
                </div>
                <Badge variant="secondary" className="w-fit">
                    {requests.length} Pending
                </Badge>
            </div>

            {/* Requests List */}
            <div className="grid gap-3 md:gap-4">
                {requests.length === 0 ? (
                    <div className="text-center py-12 md:py-20 bg-muted/20 border-2 border-dashed rounded-2xl md:rounded-3xl">
                        <Info className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm md:text-base">No new requests at the moment.</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <Card key={req.id} className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 md:gap-4">
                                <Avatar className="h-10 w-10 md:h-12 md:w-12 border">
                                    {/* Note: changed .image to .profileImage based on previous error fix */}
                                    <AvatarImage src={req.sender.profileImage} />
                                    <AvatarFallback>{req.sender.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-base md:text-lg leading-tight">{req.sender.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-orange-600 mt-0.5">
                                        <Flame className="w-3 h-3 fill-orange-600" />
                                        {req.sender.currentStreak} Day Streak
                                    </div>
                                </div>
                            </div>

                            {/* Buttons: Full width on mobile, auto width on desktop */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 sm:flex-none text-destructive hover:bg-destructive/10 h-9 md:h-10"
                                    onClick={() => onProcess(req.id, "REJECT")}
                                    disabled={isPending}
                                >
                                    <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 h-9 md:h-10 text-white"
                                    onClick={() => onProcess(req.id, "ACCEPT")}
                                    disabled={isPending}
                                >
                                    <Check className="w-4 h-4 mr-1" /> Accept
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* --- ACCEPT DIALOG --- */}
            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                {/* max-w-[95vw] ensures it doesn't touch screen edges on tiny devices */}
                <DialogContent className="w-[95vw] max-w-md rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-center text-lg md:text-xl font-bold">Assign to Group</DialogTitle>
                    </DialogHeader>

                    <div className="py-4 md:py-6 flex flex-col items-center gap-4">
                        <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-primary/10">
                            <AvatarImage src={selectedRequest?.sender.profileImage} />
                            <AvatarFallback>{selectedRequest?.sender.name?.[0]}</AvatarFallback>
                        </Avatar>

                        <p className="text-center text-sm md:text-base px-2">
                            Where would you like to add <strong>{selectedRequest?.sender.name}</strong>?
                        </p>

                        <Select onValueChange={setTargetGroupId}>
                            <SelectTrigger className="w-full h-11 md:h-12 rounded-xl">
                                <SelectValue placeholder="Select a Sadhaka Group" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map(g => (
                                    <SelectItem key={g.id} value={g.id}>
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">{g.name} ({g.memberCount})</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="sm:flex-col">
                        <Button
                            className="w-full h-11 md:h-12 rounded-xl font-bold text-sm md:text-base"
                            onClick={confirmAccept}
                            disabled={isPending || !targetGroupId}
                        >
                            {isPending ? "Adding..." : "Confirm & Add to Group"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}