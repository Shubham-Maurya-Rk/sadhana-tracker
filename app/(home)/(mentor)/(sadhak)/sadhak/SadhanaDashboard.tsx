"use client";

import React, { useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { SadhanaLog, SadhanaGoal } from './Calender'; // Ensure paths are correct

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SadhanaData {
    logs: SadhanaLog[];
    goals: SadhanaGoal;
}

type MetricType = 'chantingRounds' | 'totalRead' | 'lectureDuration' | 'aarti' | 'sleepCycle';

interface DashboardProps {
    data: SadhanaData;
    activeMonth: Date;
}

const SadhanaDashboard: React.FC<DashboardProps> = ({ data, activeMonth }) => {
    const [metric, setMetric] = useState<MetricType>('chantingRounds');

    const getDecimalHour = (timeInput: string | Date | null | undefined) => {
        if (!timeInput) return 0;
        const date = new Date(timeInput);
        return date.getHours() + date.getMinutes() / 60;
    };

    const chartData = useMemo(() => {
        // Sort logs chronologically to ensure the bar chart flows correctly
        const processedLogs = [...data.logs].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const labels = processedLogs.map((log) =>
            new Date(log.date).toLocaleDateString('en-US', { day: 'numeric' })
        );

        const THEME = {
            SUCCESS: 'rgb(34, 197, 94)', // Green
            PENDING: 'rgb(249, 115, 22)', // Orange
        };

        // Handle Sleep Cycle separately as it has two datasets
        if (metric === 'sleepCycle') {
            return {
                labels,
                datasets: [
                    {
                        label: 'Sleep Time',
                        data: processedLogs.map(l => getDecimalHour(l.sleepTime)),
                        backgroundColor: 'rgba(249, 115, 22, 0.7)',
                        borderRadius: 4,
                    },
                    {
                        label: 'Wake-up Time',
                        data: processedLogs.map(l => getDecimalHour(l.wakeUpTime)),
                        backgroundColor: THEME.SUCCESS,
                        borderRadius: 4,
                    }
                ]
            };
        }

        // Configuration Mapping with explicit types to prevent 'any' errors
        const metricConfigs: Record<string, { label: string; goalKey: keyof SadhanaGoal }> = {
            chantingRounds: { label: 'Rounds', goalKey: 'roundsGoal' },
            totalRead: { label: 'Pages', goalKey: 'readingGoal' },
            lectureDuration: { label: 'Minutes', goalKey: 'hearingGoal' },
            aarti: { label: 'Aartis', goalKey: 'aartisGoal' },
        };

        const config = metricConfigs[metric];

        const values = processedLogs.map(l => {
            if (metric === 'aarti') {
                return (l.mangalAarti ? 1 : 0) + (l.darshanAarti ? 1 : 0) + (l.bhogaAarti ? 1 : 0) + (l.gauraAarti ? 1 : 0);
            }
            // Cast metric to key of SadhanaLog for safe access
            return (l[metric as keyof SadhanaLog] as number) || 0;
        });

        const backgroundColors = values.map(val => {
            // Default to 0 if aartisGoal is undefined in the schema
            const goal = data.goals[config.goalKey] || 0;
            return val >= goal ? THEME.SUCCESS : THEME.PENDING;
        });

        return {
            labels,
            datasets: [{
                label: config.label,
                data: values,
                backgroundColor: backgroundColors,
                borderRadius: 4,
                barPercentage: 0.7,
            }]
        };
    }, [metric, data]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: metric === 'sleepCycle',
                position: 'top' as const,
                labels: { font: { family: 'inherit', size: 11 }, usePointStyle: true }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 14 },
                bodyFont: { size: 13 },
                callbacks: {
                    label: (context: any) => {
                        const val = context.raw;
                        if (metric === 'sleepCycle') {
                            const hour = Math.floor(val);
                            const min = Math.round((val - hour) * 60);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour % 12 || 12;
                            return `${context.dataset.label}: ${displayHour}:${min.toString().padStart(2, '0')} ${ampm}`;
                        }
                        return `${context.dataset.label}: ${val}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: metric === 'sleepCycle' ? 24 : undefined,
                grid: { color: 'rgba(156, 163, 175, 0.1)' },
                ticks: {
                    font: { size: 10 },
                    callback: (v: any) => metric === 'sleepCycle' ? v + ":00" : v
                }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 10 } }
            }
        }
    };

    return (
        <Card className="w-full border-zinc-100 dark:border-zinc-800 shadow-xl rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-6 border-b border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-800/20">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-black italic uppercase tracking-tight">
                        {format(activeMonth, 'MMMM yyyy')} Analysis
                    </CardTitle>
                    <CardDescription className="flex items-center gap-3 text-[10px] font-bold uppercase italic tracking-wider">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                            Below Goal
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                            Goal Met
                        </span>
                    </CardDescription>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
                        <SelectTrigger className="w-full md:w-[160px] h-9 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold uppercase italic text-[10px]">
                            <SelectValue placeholder="Select Metric" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                            <SelectItem value="chantingRounds" className="text-xs uppercase italic font-bold">Chanting</SelectItem>
                            <SelectItem value="totalRead" className="text-xs uppercase italic font-bold">Reading</SelectItem>
                            <SelectItem value="lectureDuration" className="text-xs uppercase italic font-bold">Hearing</SelectItem>
                            <SelectItem value="aarti" className="text-xs uppercase italic font-bold">Aarti</SelectItem>
                            <SelectItem value="sleepCycle" className="text-xs uppercase italic font-bold">Sleep Cycle</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="h-[320px] w-full pt-4">
                    <Bar data={chartData as any} options={chartOptions as any} />
                </div>
            </CardContent>
        </Card>
    );
};

export default SadhanaDashboard;