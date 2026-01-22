"use client";
import { useState, useEffect, use } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSadhakaDetailedProgress } from "@/app/actions/group";
import { MentorSadhakaHeader } from "./MentorSadhakaHeader";
import { MentorSadhakaTabs } from "./MentorSadhakaTabs";

export default function SadhakaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: sadhakId } = use(params);
    const [viewDate, setViewDate] = useState(new Date());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await getSadhakaDetailedProgress(sadhakId, viewDate);
            if (res.success) setData(res.data);
            setLoading(false);
        };
        load();
    }, [viewDate, sadhakId]);

    if (loading && !data) return (
        <div className="h-screen flex flex-col items-center justify-center bg-background">
            <Loader2 className="animate-spin text-primary h-10 w-10 mb-4" />
            <h2 className="font-black italic uppercase tracking-tighter text-xl">Loading Sadhaka Data</h2>
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-50/50 dark:bg-transparent pb-20">
            <MentorSadhakaHeader user={data} />
            
            <div className="max-w-6xl mx-auto px-4 -mt-8">
                {/* Month Controller */}
                <div className="bg-white dark:bg-zinc-900 border shadow-2xl rounded-[2.5rem] p-4 flex items-center justify-between mb-8">
                    <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" onClick={() => setViewDate(subMonths(viewDate, 1))}>
                        <ChevronLeft size={24} />
                    </Button>
                    
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-primary">
                            <CalendarIcon size={16} />
                            <h2 className="font-black italic uppercase text-xl tracking-tighter">
                                {format(viewDate, "MMMM yyyy")}
                            </h2>
                        </div>
                        <span className="text-[9px] font-bold opacity-40 uppercase tracking-[0.2em]">Viewing History</span>
                    </div>

                    <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" onClick={() => setViewDate(addMonths(viewDate, 1))}>
                        <ChevronRight size={24} />
                    </Button>
                </div>

                <MentorSadhakaTabs user={data} viewDate={viewDate} />
            </div>
        </main>
    );
}