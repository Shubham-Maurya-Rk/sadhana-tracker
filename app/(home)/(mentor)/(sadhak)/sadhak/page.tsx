import CalendarDemo from "./Calender";
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
      <div className="w-full">
        <StreakHeader
          current={data.user.currentStreak}
          highest={data.user.highestStreak}
        />
      </div>

      {/* Grid moved inside CalendarDemo to handle shared month state */}
      <CalendarDemo
        initialData={data.logs}
        goals={data.goals}
      />
    </div>
  );
}