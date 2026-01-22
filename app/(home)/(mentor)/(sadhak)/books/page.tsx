"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Minus, BookOpen, Globe, Lock, Trophy, PlusCircle, Search, CheckCircle2, RotateCcw, Flame, Trash2, Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { addPrivateBookAction, addToShelfAction, deleteBookAction, getLibraryData, resetBookProgressAction, updateBookProgressAction } from '@/app/actions/book';
import { ProgressType } from '@/generated/prisma/enums';
import { toast } from 'sonner';

// --- Types ---

interface Book {
    id: string;
    bookId: string;
    title: string;
    author: string;
    total: number;
    current: number;
    isPrivate: boolean;
    type: ProgressType;
    currentStreak: number;
    highestStreak: number;
    lastReadDate: string | null;
}

// --- Dummy Data ---
const GLOBAL_CATALOG: Partial<Book>[] = [
    { id: "101", title: "Srimad Bhagavatam", author: "Vyasadeva" },
    { id: "102", title: "Caitanya Caritamrta", author: "Krishnadasa Kaviraja" },
    { id: "103", title: "Sri Isopanisad", author: "A.C. Bhaktivedanta Swami" },
];

export default function SadhanaLibrary() {
    // Initialize with empty arrays to be populated by the server
    const [myBooks, setMyBooks] = useState<any[]>([]);
    const [globalCatalog, setGlobalCatalog] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                // Call the server action
                const data = await getLibraryData();

                // Map the server response to your component state
                // Note: server returns 'userShelf', we map it to 'myBooks'
                setMyBooks(data.userShelf || []);
                setGlobalCatalog(data.globalBooks || []);
            } catch (error) {
                console.error("Failed to load library data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);


    const [searchQuery, setSearchQuery] = useState("");

    // --- Core Logic ---

    const updateProgress = async (progressId: string, delta: number) => {
        const todayStr = new Date().toISOString().split('T')[0];

        setMyBooks(prev => prev.map(book => {
            if (book.id !== progressId) return book;

            // Calculate new progress safely between 0 and total
            const newCurrent = Math.min(book.total, Math.max(0, book.current + delta));

            let newStreak = book.currentStreak;
            let newHighest = book.highestStreak;

            const hasReadToday = book.lastReadDate?.split('T')[0] === todayStr;

            // ONLY increment streak if adding pages and haven't read today yet
            if (delta > 0 && !hasReadToday) {
                newStreak += 1;
                if (newStreak > newHighest) newHighest = newStreak;
            }
            // Note: We don't decrement streak if delta is -1. 
            // Even if they reduce count, they still "read" today.

            return {
                ...book,
                current: newCurrent,
                currentStreak: newStreak,
                highestStreak: newHighest,
                lastReadDate: new Date().toISOString()
            };
        }));

        try {
            const result = await updateBookProgressAction(progressId, delta);
            if (result.error) toast.error(result.error);
        } catch (err) {
            toast.error("Sync failed. Check your connection.");
        }
    };

    const resetProgress = async (bookId: string) => {
        // 1. Confirmation check
        if (!confirm("Are you sure you want to reset all progress for this book? Streaks will remain, but current position will return to 0.")) {
            return;
        }
        console.log(bookId)

        // 2. Save snapshot for rollback
        const previousBooks = [...myBooks];

        // 3. Pure State Update (The "Real-time" part)
        // Ensure 'currentValue' matches the property name used in your .map() rendering
        setMyBooks(prev => prev.map(book =>
            book.id === bookId
                ? { ...book, current: 0, isCompleted: false }
                : book
        ));

        try {
            const result = await resetBookProgressAction(bookId);

            if (result.success) {
                toast.success("Progress reset to 0");
                // No router.refresh() used here
            } else {
                // Rollback if the server action fails
                setMyBooks(previousBooks);
                toast.error(result.error || "Failed to reset progress");
            }
        } catch (error) {
            setMyBooks(previousBooks);
            toast.error("An unexpected error occurred");
        }
    };

    const addToShelf = async (bookData: any) => {
        // We use a promise toast so the user knows something is happening
        const toastId = toast.loading(`Adding ${bookData.title} to your shelf...`);

        try {
            const result = await addToShelfAction({
                bookId: bookData.id,
                totalUnits: bookData.totalUnits,
                type: bookData.type
            });

            if (result.error) {
                toast.error(result.error, { id: toastId });
                return;
            }

            if (result.data) {
                setMyBooks(prev => [...prev, result.data]);
                toast.success(`${result.data.title} added successfully!`, {
                    id: toastId,
                    description: "You can now track your progress in My Shelf."
                });

                // Optional: If you use a state for the active tab
                // setActiveTab("my-shelf");
            }
        } catch (error) {
            console.error("Error adding book:", error);
            toast.error("An unexpected error occurred. Please try again.", { id: toastId });
        }
    };

    const sortedMyBooks = useMemo(() => {
        return [...myBooks].sort((a, b) => {
            const aDone = a.current >= a.total;
            const bDone = b.current >= b.total;
            if (aDone && !bDone) return 1; // a goes to bottom
            if (!aDone && bDone) return -1; // a stays top
            return 0;
        });
    }, [myBooks]);
    const filteredGlobal = globalCatalog.filter(b => {
        return b.title?.toLowerCase().includes(searchQuery.toLowerCase())
    });

    const deleteBook = async (bookId: string) => {
        console.log("bookId:", bookId);
        // 1. Optimistic Update (Optional but recommended for better UX)
        const previousBooks = [...myBooks];
        setMyBooks(prev => prev.filter(book => book.bookId !== bookId));

        try {
            const result = await deleteBookAction(bookId);

            if (!result.success) {
                // Rollback if server fails
                setMyBooks(previousBooks);
                toast.error(result.error || "Failed to delete book");
            } else {
                toast.success("Book removed successfully");
            }
        } catch (error) {
            setMyBooks(previousBooks);
            toast.error("An unexpected error occurred");
        }
    };
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground italic">Fetching your Shastras...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-2xl mx-auto pb-24">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-primary">Sadhana Library</h1>
                    <p className="text-muted-foreground italic text-sm">Track your shlokas and readings daily.</p>
                </header>

                <Tabs defaultValue="my-shelf">
                    <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-xl">
                        <TabsTrigger value="my-shelf">My Shelf</TabsTrigger>
                        <TabsTrigger value="discover">Global Books</TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-shelf" className="space-y-6">
                        {myBooks.length > 0 ? (
                            // If books exist, map through them
                            myBooks.map((book) => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    onUpdate={updateProgress}
                                    onReset={resetProgress}
                                    onDelete={deleteBook}
                                />
                            ))
                        ) : (
                            // Empty State UI
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed rounded-[2rem] border-muted/30 bg-muted/5">
                                <div className="bg-primary/10 p-4 rounded-full mb-4">
                                    <BookOpen className="w-8 h-8 text-primary/60" />
                                </div>
                                <h3 className="text-xl font-semibold">Your shelf is empty</h3>
                                <p className="text-muted-foreground text-sm max-w-[250px] mt-2 mb-6">
                                    Start your spiritual journey by adding a scripture from the Global Books tab.
                                </p>
                                {/* <Button
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => document.querySelector('[value="discover"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
                                >
                                    Browse Scriptures
                                </Button> */}
                            </div>
                        )}

                        <AddBookDialog onAdd={(b) => setMyBooks([...myBooks, b])} />
                    </TabsContent>

                    <TabsContent value="discover" className="space-y-4">
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                className="pl-10 h-12 rounded-xl"
                                placeholder="Search Scriptures..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {filteredGlobal.map(book => (
                            <GlobalItem
                                key={book.id}
                                book={book}
                                isAdded={myBooks.some(b => b.id === book.id)}
                                addToShelf={addToShelf}
                            />
                        ))}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// --- Sub-Components ---

function BookCard({ book, onUpdate, onReset, onDelete }: {
    book: Book,
    onUpdate: (id: string, d: number) => void,
    onReset: (id: string) => void,
    onDelete: (id: string) => void // Add this prop
}) {
    const isCompleted = book.current >= book.total;
    const progress = (book.current / book.total) * 100;
    const typeColor = book.type === 'SHLOKA' ? 'bg-orange-500' : 'bg-blue-500';

    return (
        <Card className={`relative overflow-hidden border-none shadow-lg transition-all duration-500 rounded-3xl ${isCompleted
            ? 'bg-gradient-to-br from-yellow-50/50 via-card to-yellow-100/30 dark:from-yellow-900/10 dark:to-background border border-yellow-200/50 opacity-90 scale-[0.98]'
            : 'bg-card'
            }`}>
            {/* Left Accent Bar */}
            <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-500 ${isCompleted ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : typeColor
                }`} />

            <CardHeader className="p-5">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            {isCompleted ? (
                                <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-500/20 animate-pulse">
                                    <Trophy className="w-3 h-3 text-yellow-600" />
                                    <span className="text-[10px] font-black text-yellow-700 uppercase">Scripture Completed</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    {/* Current Streak */}
                                    <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-full">
                                        <Flame className="w-3 h-3 text-orange-600" />
                                        <span className="text-[10px] font-bold text-orange-700">{book.currentStreak} Day Streak</span>
                                    </div>

                                    {/* Highest Streak - Compact Record Badge */}
                                    <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/10" title="Highest Streak">
                                        <Star className="w-2.5 h-2.5 text-yellow-600 fill-yellow-600" />
                                        <span className="text-[10px] font-bold text-yellow-700">{book.highestStreak} Max</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <CardTitle className={`text-xl font-bold transition-colors ${isCompleted ? 'text-yellow-900 dark:text-yellow-500' : ''}`}>
                            {book.title}
                        </CardTitle>
                        <CardDescription>{book.author}</CardDescription>
                    </div>

                    {/* Action Buttons: Reset & Delete */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                            onClick={() => onReset(book.id)}
                            title="Reset Progress"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                            onClick={() => {
                                if (confirm("Remove this book from your shelf? Your progress will be lost.")) {
                                    onDelete(book.bookId);
                                }
                            }}
                            title="Remove Book"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-4">
                <div className="relative">
                    <Progress
                        value={progress}
                        className={`h-2.5 transition-all ${isCompleted ? '[&>div]:bg-yellow-500' : ''}`}
                    />
                </div>

                <div className={`flex justify-between items-center p-4 rounded-2xl transition-colors ${isCompleted ? 'bg-yellow-500/10 border border-yellow-500/10' : 'bg-secondary/30'
                    }`}>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Status</p>
                        <p className={`text-lg font-mono font-bold ${isCompleted ? 'text-yellow-700 dark:text-yellow-500' : ''}`}>
                            {isCompleted ? "Fully Realized" : `${book.current} / ${book.total}`}
                            {!isCompleted && <span className="text-xs ml-1 opacity-60">{book.type}s</span>}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isCompleted ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full h-10 w-10 border-2"
                                    onClick={() => onUpdate(book.id, -1)}
                                    disabled={book.current === 0}
                                >
                                    <Minus className="w-4 h-4" />
                                </Button>
                                <Button
                                    className={`h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 ${typeColor} text-white`}
                                    onClick={() => onUpdate(book.id, 1)}
                                >
                                    <Plus className="w-6 h-6" />
                                </Button>
                            </>
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                                <CheckCircle2 className="w-7 h-7 text-white" />
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            {isCompleted && (
                <Trophy className="absolute -bottom-4 -right-4 w-24 h-24 text-yellow-500/10 -rotate-12 pointer-events-none" />
            )}
        </Card>
    );
}

function GlobalItem({ book, isAdded, addToShelf }: { book: Book, isAdded: boolean, addToShelf: (book: Book) => void }) {
    const [customPages, setCustomPages] = useState<number>(0);
    const [type, setType] = useState<ProgressType>("PAGE");
    const [open, setOpen] = useState(false);
    const onJoin = () => {
        // This function is called after the user clicks "Confirm" in the Dialog
        if (customPages === 0) {
            toast.error("Please enter a valid number of pages.");
            return;
        }
        const bookWithPages = { ...book, totalUnits: customPages, type };
        addToShelf(bookWithPages);
        setOpen(false);
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Card className="group border border-border/40 bg-card/40 hover:bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 p-5 rounded-3xl mb-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Icon Container */}
                        <div className="relative flex-shrink-0">
                            <div className="bg-primary/10 p-3.5 rounded-2xl border border-primary/10 shadow-sm transition-transform group-hover:scale-105">
                                <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                        </div>

                        {/* Book Info: Shows Name and Author */}
                        <div className="flex flex-col space-y-1">
                            <h4 className="font-extrabold text-xl leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
                                {book.title}
                            </h4>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-muted-foreground/80">
                                    {book.author || "Srila Prabhupada"}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase tracking-widest">
                                    Scripture
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Button: Add to Shelf */}
                    <DialogTrigger asChild>
                        <Button
                            variant={isAdded ? "ghost" : "outline"}
                            disabled={isAdded}
                            className={`rounded-2xl px-7 font-black h-12 transition-all shrink-0 ${!isAdded
                                ? "border-primary/30 hover:border-primary hover:bg-primary/5 text-primary shadow-sm active:scale-95"
                                : "text-green-600 opacity-100 bg-green-50/50"
                                }`}
                        >
                            {isAdded ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>Added</span>
                                </div>
                            ) : (
                                "Add to Shelf"
                            )}
                        </Button>
                    </DialogTrigger>
                </div>
            </Card>

            {/* The Dialog Content: This is where you paste the Dialog code */}
            <DialogContent className="rounded-[2rem] sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Setup Your Edition</DialogTitle>
                    <DialogDescription>
                        Choose your tracking method and total count for <strong>{book.title}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Progress Type Selection */}
                    <div className="grid gap-2">
                        <Label className="ml-1 font-bold">Tracking Unit</Label>
                        <Tabs
                            defaultValue="PAGE"
                            onValueChange={(val) => setType(val as ProgressType)}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl bg-secondary/50">
                                <TabsTrigger value="PAGE" className="rounded-lg">Pages</TabsTrigger>
                                <TabsTrigger value="SHLOKA" className="rounded-lg">Shlokas</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Total Units Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="units" className="ml-1 font-bold">
                            Total {type === 'PAGE' ? 'Pages' : 'Shlokas'}
                        </Label>
                        <Input
                            id="units"
                            type="number"
                            placeholder={type === 'PAGE' ? "e.g. 350" : "e.g. 700"}
                            className="h-12 rounded-xl bg-secondary/50 border-none outline-none focus-visible:ring-1 focus-visible:ring-primary"
                            value={customPages || ""}
                            onChange={(e) => setCustomPages(parseInt(e.target.value))}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:opacity-90 transition-opacity"
                        onClick={onJoin}
                    >
                        Confirm & Add to Shelf
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Reuse your previous AddBookDialog component here...
function AddBookDialog({ onAdd }: { onAdd: (b: any) => void }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [author, setAuthor] = useState(""); // New State
    const [type, setType] = useState<ProgressType>("PAGE");
    const [total, setTotal] = useState("");

    const handleSubmit = async () => {
        if (!name || !total || parseInt(total) <= 0) {
            toast.error("Please fill in all fields correctly");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading(`Adding "${name}" to your shelf...`);

        try {
            const result = await addPrivateBookAction({
                title: name,
                author: author,
                totalUnits: parseInt(total),
                type: type
            });

            if (result.error) {
                toast.error(result.error, { id: toastId });
                return;
            }

            if (result.data) {
                // This matches the logic in your addToShelf function
                onAdd(result.data);

                toast.success(`${result.data.title} added successfully!`, {
                    id: toastId,
                    description: "You can now track your private goal in My Shelf."
                });

                // Reset form and close dialog
                setName("");
                setAuthor("");
                setTotal("");
                setOpen(false);
            }
        } catch (error) {
            console.error("Error adding private book:", error);
            toast.error("An unexpected error occurred.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-20 border-dashed border-2 rounded-[2rem] text-muted-foreground hover:text-primary hover:border-primary/50 transition-all bg-secondary/20">
                    <PlusCircle className="mr-2 w-6 h-6" />
                    <span className="font-bold text-lg">Add Private Book</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="rounded-[2.5rem] sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">New Reading Goal</DialogTitle>
                    <DialogDescription>Create a personal book for your shelf.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    {/* Book Name */}
                    <div className="grid gap-2">
                        <Label className="ml-1 font-semibold">Book Name</Label>
                        <Input
                            className="h-12 rounded-2xl bg-secondary/50 border-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Srimad Bhagavatam"
                        />
                    </div>

                    {/* Author Name - NEW FIELD */}
                    <div className="grid gap-2">
                        <Label className="ml-1 font-semibold">Author Name</Label>
                        <Input
                            className="h-12 rounded-2xl bg-secondary/50 border-none"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="e.g. Srila Prabhupada"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="ml-1 font-semibold">Tracking Unit</Label>
                        <Tabs value={type} onValueChange={(val) => setType(val as ProgressType)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-2xl bg-secondary/50">
                                <TabsTrigger value="PAGE" className="rounded-xl">Pages</TabsTrigger>
                                <TabsTrigger value="SHLOKA" className="rounded-xl">Shlokas</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="grid gap-2">
                        <Label className="ml-1 font-semibold">
                            Total {type === "PAGE" ? "Pages" : "Shlokas"}
                        </Label>
                        <Input
                            type="number"
                            className="h-12 rounded-2xl bg-secondary/50 border-none"
                            value={total}
                            onChange={(e) => setTotal(e.target.value)}
                            placeholder="700"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        disabled={isLoading}
                        onClick={handleSubmit}
                        className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-500/20"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Add to Shelf"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}