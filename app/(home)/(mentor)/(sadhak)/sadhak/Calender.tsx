"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SadhanaDialog } from "./Dialog"
import { Headphones, MessageSquare, Flame, BookOpen, Loader2, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"
import { getMonthlySadhanaAction } from "@/app/actions/sadhana"
import { toast } from "sonner"

type SadhanaView = "chanting" | "hearing" | "aartis" | "reading"

interface SadhanaLog {
    date: Date
    chantingRounds: number
    lectureDuration: number
    totalRead: number
    mangalAarti: boolean
    darshanAarti: boolean
    bhogaAarti: boolean
    gauraAarti: boolean
    missedNote: string | null
}

interface SadhanaGoal {
    roundsGoal: number
    readingGoal: number
    hearingGoal: number
}

interface CalendarDemoProps {
    initialData: SadhanaLog[]
    goals: SadhanaGoal
}

export default function CalendarDemo({ initialData, goals }: CalendarDemoProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date>()
    const [open, setOpen] = React.useState(false)
    const [view, setView] = React.useState<SadhanaView>("chanting")

    // Track the month currently being viewed in the calendar
    const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date())
    // Store logs for the viewed month
    const [currentLogs, setCurrentLogs] = React.useState<SadhanaLog[]>(initialData)
    const [isLoading, setIsLoading] = React.useState(false)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch data whenever currentMonth changes
    React.useEffect(() => {
        const fetchMonthData = async () => {
            // Avoid re-fetching initial data on first load
            const isInitialMonth =
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear();

            if (isInitialMonth) {
                setCurrentLogs(initialData);
                return;
            }

            setIsLoading(true);
            try {
                const result = await getMonthlySadhanaAction(currentMonth);
                if (result?.logs) {
                    setCurrentLogs(result.logs as any);
                }
            } catch (error) {
                toast.error("Failed to load data for this month");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMonthData();
    }, [currentMonth, initialData]);

    const logsByDate = React.useMemo(() => {
        const record: Record<string, SadhanaLog> = {}
        currentLogs.forEach((log) => {
            const dateStr = format(new Date(log.date), "yyyy-MM-dd")
            record[dateStr] = log
        })
        return record
    }, [currentLogs])

    const goal = React.useMemo(() => {
        if (view === "chanting") return goals.roundsGoal;
        if (view === "hearing") return goals.hearingGoal;
        if (view === "reading") return goals.readingGoal;
        return 1;
    }, [view, goals]);

    return (
        <div className="flex flex-col gap-6 items-center mx-auto p-2 w-full overflow-x-hidden relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            <Tabs
                value={view}
                onValueChange={(v) => setView(v as SadhanaView)}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
                    <TabsTrigger value="chanting" className="gap-2 text-[10px] sm:text-sm">
                        <MessageSquare className="h-4 w-4" /> Chanting
                    </TabsTrigger>
                    <TabsTrigger value="reading" className="gap-2 text-[10px] sm:text-sm">
                        <BookOpen className="h-4 w-4" /> Reading
                    </TabsTrigger>
                    <TabsTrigger value="hearing" className="gap-2 text-[10px] sm:text-sm">
                        <Headphones className="h-4 w-4" /> Hearing
                    </TabsTrigger>
                    <TabsTrigger value="aartis" className="gap-2 text-[10px] sm:text-sm">
                        <Flame className="h-4 w-4" /> Aartis
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="w-full max-w-full overflow-x-hidden">
                <Calendar
                    mode="single"
                    disabled={(date) => date > today}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth} // This triggers our useEffect
                    selected={selectedDate}
                    onSelect={(date) => {
                        if (date && date > today) return;
                    }}
                    onDayClick={(date) => {
                        if (!date) return
                        setOpen(true)
                        setSelectedDate(date)
                    }}
                    className="rounded-lg border w-full"
                    classNames={{
                        day: "h-11 w-11 p-0 text-sm sm:h-14 sm:w-14",
                        head_cell: "w-11 text-[0.75rem] sm:w-14",
                    }}
                    components={{
                        DayButton: ({ day, modifiers, ...props }) => {
                            const dateStr = format(day.date, "yyyy-MM-dd")
                            const log = logsByDate[dateStr]

                            let numericValue = 0
                            if (log) {
                                if (view === "chanting") numericValue = log.chantingRounds || 0
                                else if (view === "reading") numericValue = log.totalRead || 0
                                else if (view === "hearing") numericValue = log.lectureDuration || 0
                                else if (view === "aartis") {
                                    numericValue = [log.mangalAarti, log.darshanAarti, log.bhogaAarti, log.gauraAarti].filter(Boolean).length
                                }
                            }

                            const getDayColor = () => {
                                if (!log) return ""
                                if (numericValue === 0) return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                                if (numericValue < goal) return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                                if (numericValue === goal) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                return "bg-emerald-200 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-200"
                            }

                            const displayLabel = view === "hearing" ? `${numericValue}m` : numericValue

                            return (
                                <button
                                    {...props}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center w-full h-full rounded-xl transition-all border-2 border-transparent",
                                        modifiers.selected && "border-primary bg-primary/5",
                                        log && getDayColor(),
                                        !log && "hover:bg-accent",
                                        modifiers.outside && "opacity-20 grayscale"
                                    )}
                                >
                                    {/* Note Indicator for Reading Tab */}
                                    {view === "reading" && log?.missedNote && (
                                        <div className="absolute top-1 right-1">
                                            <StickyNote className="h-2 w-2 sm:h-3 sm:w-3 text-current opacity-70" />
                                        </div>
                                    )}

                                    {log && (
                                        <span className="text-xs sm:text-lg font-bold leading-none mb-1">
                                            {displayLabel}
                                        </span>
                                    )}

                                    <span className={cn(
                                        "absolute bottom-1 left-1 text-[8px] sm:text-[10px] font-semibold opacity-50",
                                        modifiers.today && "text-primary opacity-100 underline underline-offset-2"
                                    )}>
                                        {format(day.date, "d")}
                                    </span>
                                </button>
                            )
                        }
                    }}
                />
            </div>

            {selectedDate && (
                <SadhanaDialog
                    key={selectedDate.toISOString()}
                    open={open}
                    setOpen={setOpen}
                    selectedDate={selectedDate}
                    goals={goals}
                />
            )}
        </div>
    )
}