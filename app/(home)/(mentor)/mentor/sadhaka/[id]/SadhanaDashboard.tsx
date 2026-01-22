"use client";

import React, { useMemo, useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DailyLog {
    date: string;
    chantingRounds: number;
    lectureDuration: number;
    totalRead: number;
    mangalAarti: boolean;
    darshanAarti: boolean;
    bhogaAarti: boolean;
    gauraAarti: boolean;
    wakeUpTime?: string | null;
    sleepTime?: string | null;
}

interface SadhanaDashboardProps {
    data: DailyLog[];
    activeMetric: string;
}

const SadhanaDashboard: React.FC<SadhanaDashboardProps> = ({ data, activeMetric }) => {
    const [selectedMetric, setSelectedMetric] = useState(activeMetric);

    useEffect(() => {
        setSelectedMetric(activeMetric);
    }, [activeMetric]);

    // Helper to convert ISO date string to decimal hours (e.g., 05:30 -> 5.5)
    const getHoursFromDate = (dateStr?: string | null) => {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        return date.getHours() + (date.getMinutes() / 60);
    };

    const chartData = useMemo(() => {
        const sortedLogs = [...(data || [])].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const labels = sortedLogs.map(log =>
            new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );

        // Handle the unique case for "sleepCycle" (Wake vs Sleep)
        if (selectedMetric === "sleepCycle") {
            return {
                labels,
                datasets: [
                    {
                        label: 'WAKE UP',
                        data: sortedLogs.map(l => getHoursFromDate(l.wakeUpTime)),
                        backgroundColor: 'rgb(250, 204, 21)', // Yellow
                        borderRadius: 4,
                    },
                    {
                        label: 'SLEEP',
                        data: sortedLogs.map(l => getHoursFromDate(l.sleepTime)),
                        backgroundColor: 'rgb(99, 102, 241)', // Indigo
                        borderRadius: 4,
                    }
                ],
            };
        }

        // Standard single metric handling
        const getMetricData = () => {
            switch (selectedMetric) {
                case "chanting": return sortedLogs.map(l => l.chantingRounds);
                case "reading": return sortedLogs.map(l => l.totalRead);
                case "hearing": return sortedLogs.map(l => l.lectureDuration);
                case "aarti": return sortedLogs.map(l =>
                    [l.mangalAarti, l.darshanAarti, l.bhogaAarti, l.gauraAarti].filter(Boolean).length
                );
                default: return sortedLogs.map(l => l.chantingRounds);
            }
        };

        return {
            labels,
            datasets: [
                {
                    label: selectedMetric.toUpperCase(),
                    data: getMetricData(),
                    backgroundColor: 'rgb(20, 184, 166)',
                    borderRadius: 6,
                    barThickness: labels.length > 15 ? 10 : 20,
                },
            ],
        };
    }, [data, selectedMetric]);

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: selectedMetric === "sleepCycle",
                labels: { font: { size: 10, weight: 600 }, usePointStyle: true }
            },
            tooltip: {
                backgroundColor: '#18181b',
                padding: 12,
                callbacks: {
                    label: (context) => {
                        if (selectedMetric === "sleepCycle") {
                            // Use || 0 to handle null/undefined values safely
                            const val = (context.parsed.y as number) || 0;

                            const hours = Math.floor(val);
                            const minutes = Math.round((val - hours) * 60);

                            // Format as HH:mm
                            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                            return ` ${context.dataset.label}: ${formattedTime}`;
                        }
                        return ` ${context.formattedValue} ${selectedMetric === 'hearing' ? 'mins' : 'units'}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: selectedMetric === "sleepCycle" ? 24 : undefined,
                ticks: {
                    font: { size: 10, weight: 600 },
                    callback: (value) => selectedMetric === "sleepCycle" ? `${value}h` : value
                }
            },
            x: { ticks: { font: { size: 10, weight: 600 } } }
        }
    };

    return (
        <div className="bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[2.5rem] p-6 border border-zinc-100 dark:border-zinc-800 space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Sadhana Analytics</span>
                    <h4 className="text-sm font-black italic uppercase tracking-tighter">Consistency Report</h4>
                </div>

                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-[160px] h-9 rounded-xl text-[10px] font-black uppercase italic">
                        <SelectValue placeholder="Metric" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="chanting" className="text-[10px] font-black uppercase italic">Chanting</SelectItem>
                        <SelectItem value="reading" className="text-[10px] font-black uppercase italic">Reading</SelectItem>
                        <SelectItem value="hearing" className="text-[10px] font-black uppercase italic">Hearing</SelectItem>
                        <SelectItem value="aarti" className="text-[10px] font-black uppercase italic">Aarti</SelectItem>
                        <SelectItem value="sleepCycle" className="text-[10px] font-black uppercase italic">Wake/Sleep Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="h-[250px] w-full">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default SadhanaDashboard;