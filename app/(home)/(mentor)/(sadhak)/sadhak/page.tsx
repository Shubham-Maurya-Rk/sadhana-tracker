// app/sadhak/dashboard/page.tsx
import CalendarDemo from "./Calender";
import SadhanaDashboard from "./SadhanaDashboard";
import { StreakHeader } from "./StreakHeader";
import { getMonthlySadhanaAction } from "@/app/actions/sadhana";

export default async function DashboardPage() {
  const data = await getMonthlySadhanaAction(new Date());

  if (!data) return (
    <div className="flex h-[50vh] items-center justify-center text-center font-black uppercase italic opacity-50">
      Please login to view your progress...
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-10 px-4 space-y-8 overflow-x-hidden">

      {/* 1. Streaks Section - Keep it full width */}
      <div className="w-full">
        <StreakHeader
          current={data.user.currentStreak}
          highest={data.user.highestStreak}
        />
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT/TOP: Calendar Section (Takes 5 columns on large screens) */}
        <div className="lg:col-span-5 flex justify-center lg:sticky lg:top-24">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[3rem] p-4 sm:p-8 shadow-xl border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-center font-black uppercase italic text-[10px] tracking-[0.3em] mb-6 text-zinc-400">
              Sadhana Tracking
            </h3>

            {/* Calendar Container */}
            <div className="w-full overflow-x-auto scrollbar-hide">
              {/* Note: The CSS overrides for table/grid should ideally be inside 
                  the CalendarDemo component to keep this page clean 
               */}
              <div className="[&_table]:w-full [&_table]:flex [&_table]:flex-col [&_thead]:w-full [&_tbody]:w-full [&_tr]:grid [&_tr]:grid-cols-7 [&_tr]:w-full [&_th]:w-full [&_td]:w-full [&_td]:flex [&_td]:justify-center [&_td]:items-center">
                <CalendarDemo
                  initialData={data.logs}
                  goals={data.goals}
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-dashed border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] text-center text-zinc-400 font-bold uppercase italic">
                Tap a date to view or log sadhana
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT/BOTTOM: Analytics Section (Takes 7 columns on large screens) */}
        <div className="lg:col-span-7 w-full">
          <SadhanaDashboard data={data} />
        </div>

      </div>
    </div>
  );
}