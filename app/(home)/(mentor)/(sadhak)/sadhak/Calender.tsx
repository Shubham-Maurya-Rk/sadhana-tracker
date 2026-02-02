"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SadhanaDialog } from "./Dialog"
import {
  Headphones,
  MessageSquare,
  Flame,
  BookOpen,
  Loader2,
  StickyNote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getMonthlySadhanaAction } from "@/app/actions/sadhana"
import { toast } from "sonner"
import SadhanaDashboard from "./SadhanaDashboard"

// --- Interfaces ---
export interface SadhanaLog {
  date: Date
  chantingRounds: number
  lectureDuration: number
  totalRead: number
  mangalAarti: boolean
  darshanAarti: boolean
  bhogaAarti: boolean
  gauraAarti: boolean
  sleepTime?: string | Date | null
  wakeUpTime?: string | Date | null
  missedNote: string | null
}

export interface SadhanaGoal {
  roundsGoal: number
  readingGoal: number
  hearingGoal: number
  aartisGoal?: number
}

interface CalendarDemoProps {
  initialData: SadhanaLog[]
  goals: SadhanaGoal
}

type SadhanaView = "chanting" | "hearing" | "aartis" | "reading"

export default function CalendarDemo({ initialData, goals }: CalendarDemoProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>()
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<SadhanaView>("chanting")
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date())
  const [currentLogs, setCurrentLogs] = React.useState<SadhanaLog[]>(initialData)
  const [isLoading, setIsLoading] = React.useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  React.useEffect(() => {
    const fetchMonthData = async () => {
      const isInitialMonth =
        currentMonth.getMonth() === new Date().getMonth() &&
        currentMonth.getFullYear() === new Date().getFullYear()

      if (isInitialMonth) {
        setCurrentLogs(initialData)
        return
      }

      setIsLoading(true)
      try {
        const result = await getMonthlySadhanaAction(currentMonth)
        if (result?.logs) setCurrentLogs(result.logs as any)
      } catch {
        toast.error("Failed to load data for this month")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMonthData()
  }, [currentMonth, initialData])

  const logsByDate = React.useMemo(() => {
    const record: Record<string, SadhanaLog> = {}
    currentLogs.forEach((log) => {
      record[format(new Date(log.date), "yyyy-MM-dd")] = log
    })
    return record
  }, [currentLogs])

  const currentGoal = React.useMemo(() => {
    if (view === "chanting") return goals.roundsGoal
    if (view === "reading") return goals.readingGoal
    if (view === "hearing") return goals.hearingGoal
    return 1
  }, [view, goals])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
      {/* LEFT: Calendar */}
      <div className="lg:col-span-5 flex justify-center lg:sticky lg:top-24">
        <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 shadow-xl border border-zinc-100 dark:border-zinc-800">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-black/60 rounded-3xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          <h3 className="text-center font-black uppercase italic text-[10px] tracking-[0.3em] mb-4 text-zinc-400">
            Sadhana Tracking
          </h3>

          <Tabs value={view} onValueChange={(v) => setView(v as SadhanaView)}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="chanting" className="gap-1 text-xs">
                <MessageSquare className="h-3 w-3" /> Japa
              </TabsTrigger>
              <TabsTrigger value="reading" className="gap-1 text-xs">
                <BookOpen className="h-3 w-3" /> Read
              </TabsTrigger>
              <TabsTrigger value="hearing" className="gap-1 text-xs">
                <Headphones className="h-3 w-3" /> Hear
              </TabsTrigger>
              <TabsTrigger value="aartis" className="gap-1 text-xs">
                <Flame className="h-3 w-3" /> Aarti
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Calendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={selectedDate}
            disabled={(date) => date > today}
            onDayClick={(date) => {
              if (!date || date > today) return
              setSelectedDate(date)
              setOpen(true)
            }}
            className="w-full"
            classNames={{
              head_row: "grid grid-cols-7 mb-2",
              head_cell:
                "text-center text-[10px] sm:text-xs uppercase italic font-bold text-zinc-500",
              row: "grid grid-cols-7 gap-1",
              cell: "flex justify-center",
              day: "w-full aspect-square",
            }}
            components={{
              DayButton: ({ day, modifiers, ...props }) => {
                const dateStr = format(day.date, "yyyy-MM-dd")
                const log = logsByDate[dateStr]

                let value = 0
                if (log) {
                  if (view === "chanting") value = log.chantingRounds
                  else if (view === "reading") value = log.totalRead
                  else if (view === "hearing") value = log.lectureDuration
                  else {
                    value = [
                      log.mangalAarti,
                      log.darshanAarti,
                      log.bhogaAarti,
                      log.gauraAarti,
                    ].filter(Boolean).length
                  }
                }

                const color =
                  !log
                    ? ""
                    : value === 0
                    ? "bg-red-100 text-red-700 dark:bg-red-500/10"
                    : value < currentGoal
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-500/10"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10"

                return (
                  <button
                    {...props}
                    className={cn(
                      "relative flex flex-col items-center justify-center w-full aspect-square rounded-xl transition active:scale-95",
                      color,
                      modifiers.selected &&
                        "ring-2 ring-primary ring-offset-2",
                      modifiers.today && "border border-primary",
                      modifiers.outside &&
                        "opacity-20 pointer-events-none"
                    )}
                  >
                    {view === "reading" && log?.missedNote && (
                      <StickyNote className="absolute top-1 right-1 h-3 w-3 opacity-70" />
                    )}

                    {log && (
                      <span className="text-xs sm:text-sm font-bold">
                        {view === "hearing" ? `${value}m` : value}
                      </span>
                    )}

                    <span className="absolute bottom-1 left-1 text-[9px] opacity-60">
                      {format(day.date, "d")}
                    </span>
                  </button>
                )
              },
            }}
          />
        </div>
      </div>

      {/* RIGHT: Dashboard */}
      <div className="lg:col-span-7 w-full">
        <SadhanaDashboard
          data={{ logs: currentLogs, goals }}
          activeMonth={currentMonth}
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
