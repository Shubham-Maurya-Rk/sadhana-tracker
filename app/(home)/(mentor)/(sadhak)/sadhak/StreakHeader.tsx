import { Flame, Trophy, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function StreakCard({ current }: { current: number }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-500/20 group">
      {/* Popover Info Button - Works on Mobile Tap */}
      <div className="absolute top-6 right-8 z-20">
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-90 rounded-full backdrop-blur-md transition-all border border-white/10 outline-none">
              <Info size={14} className="opacity-80" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className="max-w-[220px] bg-white text-zinc-900 border-none shadow-2xl p-4 rounded-2xl"
          >
            <p className="text-[12px] font-bold leading-relaxed">
              Streak Logic
            </p>
            <p className="text-[11px] text-zinc-600 mt-1 leading-snug">
              The streak increases when you consistently enter your sadhana today.
              <span className="block mt-2 text-orange-600 font-bold">
                Note: Streaks are dependent on logging, not on sadhana count.
              </span>
            </p>
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest opacity-80 italic">
            Current Momentum
          </p>
          <h2 className="text-6xl font-black italic tracking-tighter mt-1 leading-none">
            {current}
            <span className="text-2xl ml-2 uppercase opacity-90">Days</span>
          </h2>
        </div>

        <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md group-hover:scale-110 transition-transform">
          <Flame size={40} fill="white" />
        </div>
      </div>

      {/* Background Decorative Icon */}
      <Flame
        size={120}
        className="absolute -bottom-4 -right-4 opacity-10 rotate-12 transition-transform group-hover:rotate-0 duration-700"
      />
    </div>
  );
}
export function StreakHeader({ current, highest }: { current: number; highest: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Current Streak Card */}
      <StreakCard current={current} />

      {/* Highest Streak Card */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-xl group">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Personal Record</p>
            <h2 className="text-6xl font-black italic tracking-tighter mt-1 leading-none text-zinc-900 dark:text-white">
              {highest}<span className="text-2xl ml-2 uppercase text-zinc-400">Days</span>
            </h2>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-3xl group-hover:rotate-12 transition-transform">
            <Trophy size={40} className="text-yellow-600 dark:text-yellow-500" fill="currentColor" />
          </div>
        </div>
        {/* Progress Insight */}
        <div className="mt-4 flex items-center gap-2">
          <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-black uppercase italic text-zinc-500">
            {current >= highest ? "You are at your peak!" : `${highest - current} days to break record`}
          </div>
        </div>
      </div>
    </div>
  );
}