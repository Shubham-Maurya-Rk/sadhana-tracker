"use client";

import { useState, useEffect, useTransition, use } from "react";
import {
    Users, ChevronRight, Flame, MessageSquare,
    BookOpen, Trophy, ArrowLeft, GraduationCap,
    Pencil, Trash2, Loader2, Check, X,
    MoreVertical,
    MoveRight,
    UserMinus,
    Mail,
    UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CreateGroupDialog from "./GroupDialog";
import { getGroupMembers, updateGroup, deleteGroup, type MemberData, type GroupData, removeMemberFromGroup, changeMemberGroup } from "@/app/actions/group";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function GroupManagementClient({ initialGroups }: { initialGroups: GroupData[] }) {
    const router = useRouter();
    const [groups, setGroups] = useState(initialGroups);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
        groups.length > 0 ? groups[0].id : null
    );
    const [showSidebar, setShowSidebar] = useState(true);
    const [members, setMembers] = useState<MemberData[]>([]);
    const [isPending, startTransition] = useTransition();

    // Edit & Delete UI States
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [memberToMove, setMemberToMove] = useState<MemberData | null>(null);
    const [targetGroupId, setTargetGroupId] = useState<string>("");
    const currentGroup = groups.find(g => g.id === selectedGroupId);

    useEffect(() => {
        if (selectedGroupId) {
            startTransition(async () => {
                const { data, error } = await getGroupMembers(selectedGroupId);
                if (!error && data) setMembers(data);
                else setMembers([]);
            });
            setIsEditing(false);
        }
    }, [selectedGroupId]);

    const handleNewGroup = (newGroup: GroupData) => {
        setGroups((prev) => [newGroup, ...prev]);
        setSelectedGroupId(newGroup.id);
    };

    const handleUpdate = async () => {
        if (!selectedGroupId || !editName.trim()) return;
        const res = await updateGroup(selectedGroupId, editName);
        if (res.success) {
            setGroups(groups.map(g => g.id === selectedGroupId ? { ...g, name: editName } : g));
            setIsEditing(false);
            toast.success("Group renamed");
        } else {
            toast.error("Update failed");
        }
    };

    const handleDelete = async () => {
        if (!selectedGroupId) return;
        setIsDeleting(true);
        const res = await deleteGroup(selectedGroupId);

        if (res.success) {
            const remaining = groups.filter(g => g.id !== selectedGroupId);
            setGroups(remaining);
            setSelectedGroupId(remaining.length > 0 ? remaining[0].id : null);
            toast.success("Group deleted");
            setIsDeleteDialogOpen(false); // <--- THIS HIDES THE DIALOG
        } else {
            toast.error("Delete failed");
        }
        setIsDeleting(false);
    };

    return (
        <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden bg-background border rounded-2xl shadow-sm">
            {/* --- SIDEBAR --- */}
            <aside className={`${!showSidebar ? "hidden" : "flex"} md:flex w-full md:w-80 border-r flex-col bg-muted/10`}>
                <div className="p-4 border-b bg-background flex justify-between items-center">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        Groups
                    </h2>

                    <div className="flex items-center gap-2">
                        {/* Requests Link with Tooltip for clarity */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/mentor/requests">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all active:scale-95"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent className="bg-zinc-900 text-white border-none text-[10px] font-bold uppercase tracking-wider">
                                    Mentor Requests
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Your Existing Create Group Button */}
                        <CreateGroupDialog onGroupCreated={handleNewGroup} />
                    </div>
                </div>
                <ScrollArea className="flex-1 p-3">
                    <div className="space-y-1">
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                onClick={() => { setSelectedGroupId(group.id); if (window.innerWidth < 768) setShowSidebar(false); }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedGroupId === group.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedGroupId === group.id ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-sm leading-tight">{group.name}</p>
                                        <p className={`text-[11px] ${selectedGroupId === group.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{group.memberCount} Sadhakas</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-50" />
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className={`${showSidebar ? "hidden" : "flex"} md:flex flex-1 flex-col bg-background`}>
                <div className="p-4 border-b flex items-center justify-between md:bg-muted/5">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowSidebar(true)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="h-9 w-48 font-bold text-lg focus-visible:ring-primary"
                                    autoFocus
                                />
                                <Button size="icon" className="h-9 w-9" onClick={handleUpdate}><Check className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
                            </div>
                        ) : (
                            <div>
                                <h3 className="font-bold text-xl leading-none">{currentGroup?.name || "Select Group"}</h3>
                                <p className="text-sm text-muted-foreground mt-1">Manage your students and track progress</p>
                            </div>
                        )}
                    </div>

                    {/* ACTION ICONS */}
                    {selectedGroupId && !isEditing && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full"
                                onClick={() => { setIsEditing(true); setEditName(currentGroup?.name || ""); }}
                            >
                                <Pencil className="w-4 h-4" />
                            </Button>

                            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-3xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold">Delete Group?</DialogTitle>
                                        <div className="py-4">
                                            <p className="text-sm text-muted-foreground">
                                                This will permanently remove <span className="font-bold text-foreground">"{currentGroup?.name}"</span> and all member associations.
                                            </p>
                                        </div>
                                    </DialogHeader>
                                    <DialogFooter className="gap-2 sm:gap-0">
                                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="font-bold"
                                        >
                                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Delete Group
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </div>

                <ScrollArea className="flex-1 p-6">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Active Sadhakas</h4>
                            <Badge variant="outline" className="font-medium">
                                {isPending ? "Loading..." : `${members.length} Total`}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {isPending ? (
                                [1, 2, 3].map(n => <div key={n} className="h-20 w-full rounded-2xl bg-muted animate-pulse" />)
                            ) : members.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/5">
                                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                                    <p className="text-muted-foreground italic">No members found in this group.</p>
                                </div>
                            ) : (
                                members.map((member) => (
                                    <Link
                                        key={member.id}
                                        href={`/mentor/sadhaka/${member.id}`}
                                        className="block w-full"
                                    >
                                        <Card className="group transition-all hover:shadow-premium hover:border-primary/30 cursor-pointer overflow-hidden border-muted/60 bg-card">
                                            <div className="flex items-center justify-between p-3 sm:p-5 gap-3">
                                                {/* Left Section: Avatar & Info */}
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                    <Avatar className="h-10 w-10 sm:h-14 sm:w-14 border-2 border-background shadow-sm shrink-0">
                                                        <AvatarImage src={member.image || ""} />
                                                        <AvatarFallback className="bg-primary/5 text-primary font-bold text-sm sm:text-base">
                                                            {member.name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-foreground truncate text-sm sm:text-base">
                                                            {member.name}
                                                        </p>

                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-0.5">
                                                            {/* Streak - Always visible */}
                                                            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-tight text-orange-600">
                                                                <Flame
                                                                    size={14}
                                                                    className={`${member.currentStreak > 0 ? 'fill-orange-600' : 'text-orange-300'}`}
                                                                />
                                                                {member.currentStreak} Day Streak
                                                            </div>

                                                            {/* Book/Shloka - Truncated on small mobile */}
                                                            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
                                                                <BookOpen size={12} className="shrink-0" />
                                                                <span className="truncate max-w-[120px] sm:max-w-none">
                                                                    {member.bookName}: {member.lastShloka}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Section: Action Dropdown */}
                                                <div className="flex items-center shrink-0">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-muted"
                                                                onClick={(e) => e.preventDefault()} // Keeps the card link from firing on mobile tap
                                                            >
                                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-premium border-muted/40">
                                                            <DropdownMenuLabel className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                                                Member Actions
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer py-2.5 rounded-lg"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setMemberToMove(member);
                                                                    setTargetGroupId("");
                                                                }}
                                                            >
                                                                <MoveRight className="w-4 h-4" /> Change Group
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer py-2.5 rounded-lg"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    router.push(`/chats?open=${member.id}`);
                                                                }}
                                                            >
                                                                <Mail className="w-4 h-4" /> Send Message
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer py-2.5 rounded-lg text-destructive focus:text-destructive focus:bg-destructive/5"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    // ... remove logic
                                                                }}
                                                            >
                                                                <UserMinus className="w-4 h-4" /> Remove Member
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </ScrollArea>
                {/* 2. Add the Change Group Dialog (Place this outside the loop, near other Dialogs) */}
                <Dialog open={!!memberToMove} onOpenChange={() => setMemberToMove(null)}>
                    <DialogContent className="w-[95vw] max-w-md rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="text-center text-lg md:text-xl font-bold">Move to Different Group</DialogTitle>
                        </DialogHeader>

                        <div className="py-4 md:py-6 flex flex-col items-center gap-4">
                            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-primary/10">
                                <AvatarImage src={memberToMove?.image || ""} />
                                <AvatarFallback>{memberToMove?.name?.[0]}</AvatarFallback>
                            </Avatar>

                            <div className="text-center">
                                <p className="text-sm md:text-base px-2">
                                    Move <strong>{memberToMove?.name}</strong> from <span className="text-primary">{currentGroup?.name}</span> to:
                                </p>
                            </div>

                            <Select onValueChange={setTargetGroupId} value={targetGroupId}>
                                <SelectTrigger className="w-full h-11 md:h-12 rounded-xl">
                                    <SelectValue placeholder="Select New Group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Filter out the current group so they don't move a user to the same group */}
                                    {groups.filter(g => g.id !== selectedGroupId).map(g => (
                                        <SelectItem key={g.id} value={g.id}>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm">{g.name} ({g.memberCount} members)</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter className="sm:flex-col gap-2">
                            <Button
                                className="w-full h-11 md:h-12 rounded-xl font-bold text-sm md:text-base"
                                disabled={!targetGroupId || isPending}
                                // Inside your "Confirm Move" onClick handler:
                                onClick={async () => {
                                    if (!memberToMove || !selectedGroupId) return;

                                    startTransition(async () => {
                                        const res = await changeMemberGroup(memberToMove.id, selectedGroupId, targetGroupId);
                                        if (res.success) {
                                            toast.success(`Moved ${memberToMove.name} successfully`);

                                            // 1. Update the member list for the current view
                                            setMembers(prev => prev.filter(m => m.id !== memberToMove.id));

                                            // 2. Update the group counts in the sidebar
                                            setGroups(prevGroups => prevGroups.map(group => {
                                                if (group.id === selectedGroupId) {
                                                    // Decrease count for the group the user just left
                                                    return { ...group, memberCount: Math.max(0, group.memberCount - 1) };
                                                }
                                                if (group.id === targetGroupId) {
                                                    // Increase count for the group the user just joined
                                                    return { ...group, memberCount: group.memberCount + 1 };
                                                }
                                                return group;
                                            }));

                                            setMemberToMove(null);
                                        } else {
                                            toast.error(res.error || "Failed to move member");
                                        }
                                    });
                                }}
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Confirm Move
                            </Button>
                            <Button variant="ghost" onClick={() => setMemberToMove(null)} className="rounded-xl">
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div >
    );
}