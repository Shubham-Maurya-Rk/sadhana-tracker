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

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DailyLog {
    date: string | Date;
    chantingRounds: number;
    lectureDuration: number;
    totalRead: number;
    mangalAarti: boolean;
    darshanAarti: boolean;
    bhogaAarti: boolean;
    gauraAarti: boolean;
    sleepTime?: string | Date | null;
    wakeUpTime?: string | Date | null;
    missedNote?: string | null;
}

interface SadhanaData {
    logs: DailyLog[];
    goals: {
        roundsGoal: number;
        readingGoal: number;
        hearingGoal: number;
        aartisGoal?: number; // Added to match your schema logic
    };
}

type MetricType = 'chantingRounds' | 'totalRead' | 'lectureDuration' | 'aarti' | 'sleepCycle';
type RangeType = '7' | '30' | 'all';

const SadhanaDashboard: React.FC<{ data: SadhanaData }> = ({ data }) => {
    const [metric, setMetric] = useState<MetricType>('chantingRounds');
    const [range, setRange] = useState<RangeType>('7');

    const getDecimalHour = (timeInput: string | Date | null | undefined) => {
        if (!timeInput) return 0;
        const date = new Date(timeInput);
        return date.getHours() + date.getMinutes() / 60;
    };

    const chartData = useMemo(() => {
        let processedLogs = [...data.logs].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        if (range !== 'all') {
            processedLogs = processedLogs.slice(-parseInt(range));
        }

        const labels = processedLogs.map((log) =>
            new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );

        // Define Theme Colors
        const THEME = {
            SUCCESS: 'rgb(34, 197, 94)', // Green-500
            PENDING: 'rgb(249, 115, 22)', // Orange-500 (Theme Primary)
        };

        if (metric === 'sleepCycle') {
            return {
                labels,
                datasets: [
                    {
                        label: 'Sleep Time',
                        data: processedLogs.map(l => getDecimalHour(l.sleepTime)),
                        backgroundColor: 'rgba(249, 115, 22, 0.7)', // Orange with opacity
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

        const getMetricConfig = () => {
            switch (metric) {
                case 'chantingRounds':
                    return { label: 'Rounds', goalKey: 'roundsGoal' };
                case 'totalRead':
                    return { label: 'Pages', goalKey: 'readingGoal' };
                case 'lectureDuration':
                    return { label: 'Minutes', goalKey: 'hearingGoal' };
                case 'aarti':
                    return { label: 'Aartis', goalKey: 'aartisGoal' };
                default:
                    return { label: '', goalKey: '' };
            }
        };

        const config = getMetricConfig();

        // Calculate values and assign colors based on goals
        const values = processedLogs.map(l => {
            if (metric === 'aarti') {
                return (l.mangalAarti ? 1 : 0) + (l.darshanAarti ? 1 : 0) + (l.bhogaAarti ? 1 : 0) + (l.gauraAarti ? 1 : 0);
            }
            return l[metric as keyof DailyLog] as number;
        });

        const backgroundColors = values.map(val => {
            const goal = data.goals[config.goalKey as keyof typeof data.goals] || 0;
            return val >= goal ? THEME.SUCCESS : THEME.PENDING;
        });

        return {
            labels,
            datasets: [{
                label: config.label,
                data: values,
                backgroundColor: backgroundColors,
                borderRadius: 6,
                barPercentage: range === 'all' ? 0.8 : 0.6,
            }]
        };
    }, [metric, range, data]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: metric === 'sleepCycle',
                position: 'top' as const,
                labels: { usePointStyle: true, boxWidth: 6 }
            },
            tooltip: {
                backgroundColor: 'hsl(222.2 84% 4.9%)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context: any) => {
                        const val = context.raw;
                        if (metric === 'sleepCycle') {
                            const hour = Math.floor(val);
                            const minutes = Math.round((val - hour) * 60);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour % 12 || 12;
                            return `${context.dataset.label}: ${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
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
                grid: { color: 'rgba(156, 163, 175, 0.05)' },
                ticks: {
                    color: 'rgb(156, 163, 175)',
                    font: { size: 11 },
                    callback: (value: any) => metric === 'sleepCycle' ? value + ":00" : value
                }
            },
            x: {
                grid: { display: false },
                ticks: { color: 'rgb(156, 163, 175)', font: { size: 11 } }
            }
        }
    };

    return (
        <Card className="w-full border-none sm:border shadow-none sm:shadow-sm bg-card">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold tracking-tight">Sadhana Analysis</CardTitle>
                    <CardDescription className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span> Below Goal
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Goal Met
                        </span>
                    </CardDescription>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={range} onValueChange={(v) => setRange(v as RangeType)}>
                        <SelectTrigger className="w-full md:w-[130px] h-9">
                            <SelectValue placeholder="Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="all">All History</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
                        <SelectTrigger className="w-full md:w-[130px] h-9">
                            <SelectValue placeholder="Metric" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="chantingRounds">Chanting</SelectItem>
                            <SelectItem value="totalRead">Reading</SelectItem>
                            <SelectItem value="lectureDuration">Hearing</SelectItem>
                            <SelectItem value="aarti">Aarti</SelectItem>
                            <SelectItem value="sleepCycle">Sleep Cycle</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full pt-2">
                    <Bar data={chartData} options={chartOptions as any} />
                </div>
            </CardContent>
        </Card>
    );
};

export default SadhanaDashboard;