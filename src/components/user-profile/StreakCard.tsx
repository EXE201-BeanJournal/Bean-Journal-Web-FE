import { Pin, Check } from "lucide-react";

// --- START TIMEZONE HELPER ---
const TARGET_TIMEZONE = 'Asia/Bangkok';

// Utility to get date parts in a specific timezone
const getDatePartsInTimezone = (
  date: Date,
  timeZone: string
): { year: number; monthIndex: number; day: number; monthShortName: string; dateString: string } => {
  // For year, month, day numeric parts using 'en-CA' for YYYY-MM-DD format
  const ymdFormatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' often yields YYYY-MM-DD
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const formattedDateStr = ymdFormatter.format(date); // Expected: YYYY-MM-DD

  const partsArray = formattedDateStr.split('-');
  const year = parseInt(partsArray[0], 10);
  const monthIndex = parseInt(partsArray[1], 10) - 1; // 0-indexed for JS
  const day = parseInt(partsArray[2], 10);

  // For short month name
  const monthNamer = new Intl.DateTimeFormat('en-US', { // Using 'en-US' for standard short month names
    timeZone,
    month: 'short',
  });
  const monthShortName = monthNamer.format(date);

  return {
    year,
    monthIndex,
    day,
    monthShortName,
    dateString: formattedDateStr, // YYYY-MM-DD
  };
};

// Helper for Streak Card day abbreviations, respecting a target timezone
const getDayAbbreviationForStreakInTimezone = (date: Date, timeZone: string): string => {
    const parts = getDatePartsInTimezone(date, timeZone);
    const dateAtMidnightInTargetZoneAsUTC = new Date(Date.UTC(parts.year, parts.monthIndex, parts.day));
    const dayOfWeek = dateAtMidnightInTargetZoneAsUTC.getUTCDay();
    const dayAbbreviations = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
    return dayAbbreviations[dayOfWeek];
};
// --- END TIMEZONE HELPER ---

interface StreakCardProps {
    currentStreak: number;
    streakedDays: string[]; // expecting ["M", "Tu", "W", "Th", "F", "Sa", "Su"]
}

const StreakCard = ({ currentStreak, streakedDays }: StreakCardProps) => {

    // Helper data for Streak Card
    const weekDaysForStreakCard = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i)); // 6 days ago to today
        return date;
    });

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Streak</h3>
            <div className="relative p-4 bg-[#F0F7F0] dark:bg-gray-700/30 backdrop-blur-md rounded-lg shadow-lg text-sm">
                <Pin
                    size={24}
                    className="absolute top-1 right-1 text-red-500 -rotate-45 opacity-70"
                />
                <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-[#A8D5B0] rounded-full flex items-center justify-center relative dark:bg-[#6A9C78]">
                        <div className="w-10 h-10 bg-[#70A970] rounded-tl-[50px] rounded-tr-[50px] rounded-bl-[30px] rounded-br-[30px] dark:bg-[#507D50]"></div>
                        <div className="absolute w-4 h-2 border-b-2 border-t-2 border-l-2 border-r-2 rounded-b-full border-black/70 dark:border-white/70 bottom-[22px] left-1/2 transform -translate-x-1/2"></div>
                        <span
                            className="absolute text-2xl font-bold text-white"
                            style={{
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                            }}
                        >
                            {currentStreak}
                        </span>
                    </div>
                    <span className="text-2xl font-bold text-[#6A9C78] dark:text-[#A8D5B0]">
                        day streak!
                    </span>
                </div>
                <div className="mt-4 flex justify-around items-end">
                    {weekDaysForStreakCard.map((date, index) => {
                        const dayAbbreviation = getDayAbbreviationForStreakInTimezone(date, TARGET_TIMEZONE);
                        const dayIsStreaked = streakedDays.includes(dayAbbreviation);
                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center space-y-1"
                            >
                                <div
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center
                          ${dayIsStreaked
                                            ? "bg-[#A8D5B0] border-[#A8D5B0] dark:bg-[#6A9C78] dark:border-[#6A9C78]"
                                            : "border-[#A8D5B0] bg-white/30 dark:border-[#6A9C78] dark:bg-transparent"
                                        }`}
                                >
                                    {dayIsStreaked && (
                                        <Check size={18} className="text-white" />
                                    )}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {dayAbbreviation}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}

export default StreakCard; 