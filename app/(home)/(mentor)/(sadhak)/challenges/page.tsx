"use client"

import React, { useState, useTransition, useEffect, useCallback } from "react"
import {
    createChallenge,
    addShloka,
    updateShlokaStatus,
    getChallenges, // New Fetch Action
    deleteShloka,
    deleteChallenge
} from "@/app/actions/challenge"
import { BookOpen, CheckCircle2, Circle, Flame, Library, Plus, RotateCcw, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
// ... keep your other imports (Badge, Dialog, etc.)

export default function ShlokaChallengePage() {
    const [isPending, startTransition] = useTransition()
    const [challenges, setChallenges] = useState<any[]>([])
    const [selectedChallenge, setSelectedChallenge] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Form & Search States
    const [searchQuery, setSearchQuery] = useState("")
    const [newChallengeTitle, setNewChallengeTitle] = useState("")
    const [newShlokaRef, setNewShlokaRef] = useState("")
    const [newShlokaContent, setNewShlokaContent] = useState("")
    const [newShlokaTranslation, setNewShlokaTranslation] = useState("")
    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false)
    const [isShlokaModalOpen, setIsShlokaModalOpen] = useState(false)

    /** --- DATA FETCHING --- **/
    const loadData = useCallback(async () => {
        const data = await getChallenges()
        setChallenges(data)

        // If nothing is selected yet, select the first challenge found
        if (data.length > 0 && !selectedChallenge) {
            setSelectedChallenge(data[0])
        }
        // If something was selected, refresh that specific object from the new data
        else if (selectedChallenge) {
            const updated = data.find(c => c.id === selectedChallenge.id)
            setSelectedChallenge(updated || data[0] || null)
        }
        setIsLoading(false)
    }, [selectedChallenge])

    useEffect(() => {
        loadData()
    }, []) // Run once on mount

    /** --- HANDLERS --- **/
    const handleStatusUpdate = async (id: string, status: any) => {
        // We use a promise toast because streak calculations and DB transactions 
        // can take a few hundred milliseconds
        startTransition(async () => {
            try {
                const res = await updateShlokaStatus(id, status);
                if (res.success) {
                    await loadData();
                    toast.success("Progress updated!");
                } else {
                    toast.error("Failed to update status.");
                }
            } catch (error) {
                toast.error("An unexpected error occurred.");
            }
        });
    };

    const handleCreateChallenge = async () => {
        if (!newChallengeTitle.trim()) {
            return toast.error("Please enter a book name");
        }

        const res = await createChallenge(newChallengeTitle);

        if (res.success) {
            setIsChallengeModalOpen(false);
            setNewChallengeTitle("");
            await loadData();
            toast.success(`"${newChallengeTitle}" added to your list!`);
        } else {
            toast.error(res.error || "Failed to create book");
        }
    };

    const handleAddShloka = async () => {
        if (!selectedChallenge) return;
        if (!newShlokaRef || !newShlokaContent) {
            return toast.error("Please fill in all shloka details");
        }

        // Example of using toast.promise for a cleaner "loading" experience
        toast.promise(addShloka(selectedChallenge.id, newShlokaRef, newShlokaContent, newShlokaTranslation), {
            loading: 'Adding shloka to scripture...',
            success: (res) => {
                if (res.success) {
                    setIsShlokaModalOpen(false);
                    setNewShlokaRef("");
                    setNewShlokaContent("");
                    setNewShlokaTranslation("");
                    loadData(); // No need to await inside toast for visual updates
                    return "Shloka added successfully!";
                }
                throw new Error("Failed");
            },
            error: "Could not add shloka. Please try again.",
        });
    };

    const handleDeleteChallenge = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        if (confirm("Are you sure you want to delete this entire book?")) {
            // toast.promise handles loading, success, and error states automatically
            toast.promise(deleteChallenge(id), {
                loading: 'Deleting book...',
                success: (data) => {
                    if (data.success) {
                        loadData(); // Refresh UI
                        return "Book deleted successfully";
                    }
                    throw new Error("Failed"); // Triggers the error message below
                },
                error: "Could not delete the book. Please try again.",
            });
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this shloka?")) {
            startTransition(async () => {
                try {
                    await deleteShloka(id);
                    await loadData();
                    toast.success("Shloka removed from list");
                } catch (error) {
                    toast.error("Failed to delete shloka");
                }
            });
        }
    };

    const filteredShlokas = selectedChallenge?.shlokas?.filter((s: any) =>
        s.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    if (isLoading) return <div className="p-20 text-center">Loading your library...</div>

    return (
        <div className="container max-w-6xl py-8 space-y-10 mx-auto px-4">
            {/* HERO SECTION */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-muted/30 p-6 rounded-2xl border">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Shloka Challenge</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Tracking your journey with <span className="text-foreground font-semibold">{selectedChallenge?.title || "Choose a book"}</span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-3 bg-background px-5 py-3 rounded-xl border border-orange-200 shadow-sm">
                        <Flame className="h-6 w-6 text-orange-600" />
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Current Streak</p>
                            <p className="text-2xl font-black text-orange-600">{selectedChallenge?.currentStreak || 0} Days</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* SIDEBAR */}
                {/* SIDEBAR */}
                <aside className="lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Library className="h-5 w-5 text-primary" /> Your Library
                        </h2>

                        <Dialog open={isChallengeModalOpen} onOpenChange={setIsChallengeModalOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 gap-1">
                                    <Plus className="h-3.5 w-3.5" /> New Challenge
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add New Challenge</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <Input
                                        placeholder="Book Name (e.g. Bhagavad Gita)"
                                        value={newChallengeTitle}
                                        onChange={(e) => setNewChallengeTitle(e.target.value)}
                                    />
                                    <Button className="w-full" onClick={handleCreateChallenge} disabled={isPending}>
                                        {isPending ? "Creating..." : "Create Challenge"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="space-y-3">
                        {challenges.length > 0 ? (
                            challenges.map((challenge) => (
                                <Card
                                    key={challenge.id}
                                    onClick={() => setSelectedChallenge(challenge)}
                                    className={`group relative cursor-pointer transition-all hover:bg-muted/50 ${selectedChallenge?.id === challenge.id
                                        ? 'ring-2 ring-primary border-transparent shadow-md'
                                        : ''
                                        }`}
                                >
                                    <CardHeader className="p-4 space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-sm font-semibold truncate">
                                                    {challenge.title}
                                                </CardTitle>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => handleDeleteChallenge(e, challenge.id)}
                                                    className="mt-2 h-7 gap-1 px-2 text-[10px] text-muted-foreground hover:text-destructive 
                                                    /* Mobile: Always visible (opacity-100) */
                                                    opacity-100 
                                                    /* Desktop (md and up): Hidden until hover */
                                                    md:opacity-0 md:group-hover:opacity-100 
                                                    transition-opacity"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Delete Challenge
                                                </Button>
                                            </div>

                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100" title="Current Streak">
                                                    <Flame className="h-3 w-3 text-orange-600" />
                                                    <span className="text-[10px] font-bold text-orange-700">
                                                        {challenge.currentStreak || 0}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200" title="Highest Streak">
                                                    <span className="text-[9px] font-bold text-yellow-700 uppercase tracking-tighter">Best</span>
                                                    <span className="text-[10px] font-bold text-yellow-800">
                                                        {challenge.highestStreak || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[11px] text-muted-foreground">
                                                <span>Progress</span>
                                                <span className="font-medium text-foreground">
                                                    {challenge.shlokas.filter((s: any) => s.status === 'LEARNED').length}
                                                    <span className="text-muted-foreground/60 mx-0.5">/</span>
                                                    {challenge.shlokas.length}
                                                </span>
                                            </div>

                                            <Progress
                                                value={(challenge.shlokas.filter((s: any) => s.status === 'LEARNED').length / challenge.shlokas.length) * 100 || 0}
                                                className="h-1.5"
                                            />
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))
                        ) : (
                            /* --- EMPTY LIBRARY STATE --- */
                            <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed rounded-xl bg-muted/20">
                                <Library className="h-8 w-8 text-muted-foreground/40 mb-3" />
                                <p className="text-sm font-medium text-muted-foreground text-center">
                                    No books yet
                                </p>
                                <p className="text-[11px] text-muted-foreground/60 text-center mt-1">
                                    Add a book like "Gita" to start tracking your shlokas.
                                </p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="lg:col-span-8 space-y-6">
                    {selectedChallenge ? (
                        <>
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">{selectedChallenge.title}</h2>
                                <Dialog open={isShlokaModalOpen} onOpenChange={setIsShlokaModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <Plus className="mr-2 h-4 w-4" /> Add Verse
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[525px]">
                                        <DialogHeader>
                                            <DialogTitle>Add New Shloka</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Reference</label>
                                                <Input
                                                    placeholder="e.g. BG 1.1 or SB 1.1.1"
                                                    value={newShlokaRef}
                                                    onChange={(e) => setNewShlokaRef(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Shloka (Sanskrit/Original)</label>
                                                <textarea
                                                    className="w-full p-3 rounded-md border bg-transparent focus:ring-2 focus:ring-primary outline-none min-h-[100px] text-sm italic"
                                                    placeholder="Enter the sacred verse text..."
                                                    rows={4}
                                                    value={newShlokaContent}
                                                    onChange={(e) => setNewShlokaContent(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Translation</label>
                                                <textarea
                                                    className="w-full p-3 rounded-md border bg-transparent focus:ring-2 focus:ring-primary outline-none min-h-[80px] text-sm"
                                                    placeholder="Enter the English meaning..."
                                                    rows={3}
                                                    value={newShlokaTranslation}
                                                    onChange={(e) => setNewShlokaTranslation(e.target.value)}
                                                />
                                            </div>

                                            <Button
                                                className="w-full font-bold"
                                                onClick={handleAddShloka}
                                                disabled={!newShlokaRef || !newShlokaContent}
                                            >
                                                Save Shloka
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="space-y-4">
                                {filteredShlokas.length > 0 ? (
                                    filteredShlokas.map((shloka: any) => {
                                        const statusConfig = {
                                            NOT_STARTED: { label: "Not Started", icon: Circle, color: "text-slate-400", bg: "bg-slate-50", border: "border-l-slate-200" },
                                            LEARNING: { label: "Learning", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50", border: "border-l-blue-500" },
                                            REVISION_NEEDED: { label: "Revision", icon: RotateCcw, color: "text-amber-500", bg: "bg-amber-50", border: "border-l-amber-500" },
                                            LEARNED: { label: "Learned", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-l-emerald-500" },
                                        }

                                        const currentStatus = statusConfig[shloka.status as keyof typeof statusConfig] || statusConfig.NOT_STARTED

                                        return (
                                            <Card
                                                key={shloka.id}
                                                className={`p-4 border-l-4 transition-all duration-300 ${currentStatus.border} ${isPending ? 'opacity-50 grayscale' : ''}`}
                                            >
                                                <div className="flex justify-between items-start gap-4 w-full">
                                                    {/* LEFT SIDE: Verse Details - grows to fill space, but won't push actions out */}
                                                    <div className="flex-1 min-w-0 space-y-3">
                                                        <Badge variant="secondary" className="font-mono text-[10px]">
                                                            {shloka.reference}
                                                        </Badge>
                                                        <p className="text-foreground italic whitespace-pre-wrap font-medium break-words">
                                                            {shloka.content}
                                                        </p>
                                                        {shloka.translation && (
                                                            <div className="pt-2 border-t border-muted mt-2">
                                                                <p className="text-sm text-muted-foreground leading-relaxed break-words">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-70">Translation</span>
                                                                    {shloka.translation}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* RIGHT SIDE: Action Group - fixed width, won't overflow or shrink */}
                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                        <Select
                                                            defaultValue={shloka.status}
                                                            disabled={isPending}
                                                            onValueChange={(val) => handleStatusUpdate(shloka.id, val)}
                                                        >
                                                            <SelectTrigger
                                                                className={`w-[110px] sm:w-[130px] rounded-full border-none shadow-sm transition-all ${currentStatus.bg} ${currentStatus.color} font-medium h-9 text-xs sm:text-sm`}
                                                            >
                                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                                    <currentStatus.icon className="h-3.5 w-3.5 shrink-0" />
                                                                    <SelectValue className="truncate" />
                                                                </div>
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl">
                                                                {Object.entries(statusConfig).map(([key, { label, icon: Icon, color }]) => (
                                                                    <SelectItem key={key} value={key} className="focus:bg-muted cursor-pointer">
                                                                        <div className="flex items-center gap-2">
                                                                            <Icon className={`h-4 w-4 ${color}`} />
                                                                            <span className="font-medium text-sm">{label}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={isPending}
                                                            onClick={() => handleDelete(shloka.id)}
                                                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })
                                ) : (
                                    /* --- ATTRACTIVE EMPTY STATE --- */
                                    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-3xl bg-muted/5 border-muted-foreground/20">
                                        <div className="relative mb-6">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-200 rounded-full blur-xl opacity-70 animate-pulse"></div>
                                            <div className="relative bg-background p-5 rounded-full border shadow-sm">
                                                <BookOpen className="h-10 w-10 text-primary/60" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full border-4 border-background">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold tracking-tight">Your Shloka List is Empty</h3>
                                        <p className="text-muted-foreground text-center max-w-[280px] mt-2 mb-8 text-sm">
                                            "Small steps in learning lead to great wisdom." Start by adding your first verse to this book.
                                        </p>

                                        <Button
                                            onClick={() => setIsShlokaModalOpen(true)}
                                            variant="outline"
                                            className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground transition-all"
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Add Your First Verse
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                            <p className="text-muted-foreground">Select a challenge from the library or create a new book to begin.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}