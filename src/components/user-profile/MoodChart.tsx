import { moodOptions, type MoodOption } from "@/components/diary/MoodSelector";
import type { JournalEntry } from "@/types/supabase";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

// Define a type for mood counts
interface MoodCounts {
    [mood: string]: number;
}

export interface DailyMoodDaySummary {
    date: Date;
    dayAbbreviation: string;
    dayOfMonth: string;
    moodCountsToday: MoodCounts;
    moodSegments: Array<{
        mood: MoodOption;
        count: number;
        color: string;
        heightPercent: number;
    }>;
    totalEntriesToday: number;
}

const getMoodBarColor = (moodValue: string | undefined): string => {
    if (!moodValue) return "bg-gray-300"; // Default color for no mood
    switch (moodValue.toLowerCase()) {
        case "amazing":
            return "bg-yellow-300"; // As per user image (happy/yellow)
        case "happy":
            return "bg-yellow-400"; // Slightly different yellow or same as amazing
        case "neutral":
            return "bg-sky-300";   // As per user image (neutral/light blue)
        case "sad":
            return "bg-orange-300"; // As per user image (sad/orange-peach)
        case "mad":
            return "bg-pink-400";   // As per user image (mad/pinkish-red)
        default:
            return "bg-gray-400"; // Fallback
    }
};

const getLocalDayAbbreviation = (date: Date): string => {
    const days = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
    return days[date.getDay()];
};

interface MoodChartProps {
    userJournalEntries: JournalEntry[];
}

const MoodChart = ({ userJournalEntries }: MoodChartProps) => {
    const [dailyMoodSummary, setDailyMoodSummary] = useState<DailyMoodDaySummary[]>([]);

    useEffect(() => {
        const today = new Date();
        const summary: DailyMoodDaySummary[] = [];

        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - i);
            targetDate.setHours(0, 0, 0, 0);

            const entriesOnThisDay = userJournalEntries.filter((entry) => {
                const entryDate = new Date(entry.entry_timestamp);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === targetDate.getTime();
            });

            const moodCountsToday: MoodCounts = {};
            entriesOnThisDay.forEach((entry) => {
                if (entry.manual_mood_label) {
                    moodCountsToday[entry.manual_mood_label] =
                        (moodCountsToday[entry.manual_mood_label] || 0) + 1;
                }
            });

            const segments: DailyMoodDaySummary['moodSegments'] = [];
            let totalEntriesForSegments = 0;

            // Iterate through moodOptions to maintain a consistent order in stacked bars
            moodOptions.forEach(moodOpt => {
                const count = moodCountsToday[moodOpt.value] || 0;
                if (count > 0) {
                    segments.push({
                        mood: moodOpt,
                        count: count,
                        color: getMoodBarColor(moodOpt.value),
                        heightPercent: 0, // Will be calculated later
                    });
                    totalEntriesForSegments += count;
                }
            });

            // Calculate heightPercent for each segment
            segments.forEach(segment => {
                if (totalEntriesForSegments > 0) {
                    segment.heightPercent = (segment.count / totalEntriesForSegments) * 100;
                }
            });

            summary.push({
                date: targetDate,
                dayAbbreviation: getLocalDayAbbreviation(targetDate),
                dayOfMonth: targetDate.getDate().toString(),
                moodCountsToday,
                moodSegments: segments,
                totalEntriesToday: totalEntriesForSegments, // Use this for bar height scaling
            });
        }
        setDailyMoodSummary(summary);
    }, [userJournalEntries]);


    return (
        <div>
            <h2 className="text-xl font-semibold mb-3">
                Mood chart
            </h2>
            <div className="p-4 bg-white/30 dark:bg-slate-800/40 backdrop-blur-md rounded-lg shadow-lg min-h-[280px]">
                {/* Legend Section Start */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-3 text-xs">
                    {moodOptions.map(opt => (
                        <div key={opt.value} className="flex items-center">
                            <img src={opt.emojiPath} alt={opt.label} className="w-4 h-4 mr-1.5" />
                            <span className="text-gray-700 dark:text-gray-300 capitalize">
                                {opt.label}
                            </span>
                        </div>
                    ))}
                </div>
                {/* Legend Section End */}
                <div className="mb-2 text-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {new Date().toLocaleString('default', { month: 'long' })}
                    </span>
                    {/* Add prev/next month controls here if needed */}
                </div>
                {dailyMoodSummary.length > 0 ? (
                    <div className="flex justify-around items-end h-48">
                        {dailyMoodSummary.map((dayData, index) => {
                            const maxEntriesInWeek = Math.max(...dailyMoodSummary.map(d => d.totalEntriesToday), 1);
                            const dayTotalBarHeightPercentage = dayData.totalEntriesToday > 0 ? (dayData.totalEntriesToday / maxEntriesInWeek) * 100 : 0;

                            return (
                                <div key={index} className="flex flex-col items-center space-y-1 w-1/7 px-0.5">
                                    <div
                                        className="h-40 w-8 md:w-10 flex flex-col justify-end items-center relative rounded-t-md overflow-hidden bg-gray-200 dark:bg-gray-700/50"
                                        style={{ height: '10rem' }} // Fixed height for the bar area
                                    >
                                        {dayData.totalEntriesToday > 0 ? (
                                            <div
                                                className="w-full flex flex-col justify-end items-stretch"
                                                style={{ height: `${dayTotalBarHeightPercentage}%` }}
                                            >
                                                {dayData.moodSegments.map((segment, segIndex) => (
                                                    <div
                                                        key={segIndex}
                                                        className={`${segment.color} w-full transition-all duration-300 ease-in-out`}
                                                        style={{ height: `${segment.heightPercent}%` }}
                                                        title={`${segment.mood.label}: ${segment.count}`}
                                                    ></div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="w-full h-full"></div> // Placeholder for no entries
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {dayData.dayAbbreviation}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                        {dayData.dayOfMonth}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full pt-8">
                        <TrendingUp
                            size={48}
                            className="mx-auto text-gray-400 dark:text-gray-500"
                        />
                        <p className="text-center text-sm text-gray-500 mt-2">
                            Your mood chart will appear here once you log entries.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MoodChart; 