import { moodOptions } from "@/components/diary/MoodSelector";
import type { JournalEntry } from "@/types/supabase";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import MoodLineChart from "./MoodLineChart"; // Import the new line chart component

// Mood to value mapping
const moodToValue: { [key: string]: number } = {
  mad: 1,
  sad: 2,
  neutral: 3,
  happy: 4,
  amazing: 5,
};

export interface DailyAverageMood {
  date: string;
  dayLabel: string; // Will hold the day of the month
  averageMood: number | null; // Use null for days with no entries
}

interface MoodChartProps {
  userJournalEntries: JournalEntry[];
}

const MoodChart = ({ userJournalEntries }: MoodChartProps) => {
  const [chartData, setChartData] = useState<DailyAverageMood[]>([]);
  const hasEntries = userJournalEntries && userJournalEntries.length > 0;

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed for Date object
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const data: DailyAverageMood[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const targetDate = new Date(year, month, day);
      // Format date as YYYY-MM-DD for reliable matching
      const dateString = targetDate.toISOString().split("T")[0];

      const entriesOnThisDay = userJournalEntries.filter(
        (entry) =>
          entry.entry_timestamp &&
          entry.entry_timestamp.startsWith(dateString)
      );

      let averageMood: number | null = null;
      if (entriesOnThisDay.length > 0) {
        const totalMoodValue = entriesOnThisDay.reduce((sum, entry) => {
          if (entry.manual_mood_label) {
            return sum + (moodToValue[entry.manual_mood_label] || 0);
          }
          return sum;
        }, 0);
        averageMood = totalMoodValue / entriesOnThisDay.length;
      }

      data.push({
        date: dateString,
        dayLabel: String(day), // Use day of the month for the x-axis label
        averageMood: averageMood,
      });
    }

    setChartData(data);
  }, [userJournalEntries]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Mood Chart</h2>
      <div className="p-4 bg-white/30 dark:bg-slate-800/40 backdrop-blur-md rounded-lg shadow-lg min-h-[280px] flex flex-col">
        {/* Legend Section */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-3 text-xs">
          {moodOptions.map((opt) => (
            <div key={opt.value} className="flex items-center">
              <img
                src={opt.emojiPath}
                alt={opt.label}
                className="w-4 h-4 mr-1.5"
              />
              <span className="text-gray-700 dark:text-gray-300 capitalize">
                {opt.label}
              </span>
            </div>
          ))}
        </div>

        {/* Month Title */}
        <div className="mb-2 text-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {new Date().toLocaleString("default", { month: "long" })}
          </span>
        </div>

        {/* Chart Area */}
        <div className="flex-grow flex items-center justify-center">
          {hasEntries ? (
            <MoodLineChart data={chartData} />
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
    </div>
  );
};

export default MoodChart; 