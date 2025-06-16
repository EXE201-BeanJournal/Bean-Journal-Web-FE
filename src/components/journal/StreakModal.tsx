import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileByUserId } from "@/services/profileService"; 
import { getJournalEntriesByUserId } from "@/services/journalEntryService";
import beanLogo from "@/images/logo_bean_journal.png";

// Define the shape of the data needed by the modal's view logic
interface StreakData {
  currentStreak: number;
  activeDaysOfWeek: ("M" | "Tu" | "W" | "Th" | "F" | "Sa" | "Su")[];
  lastEntryDateDisplay?: string;
}

export interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabase: SupabaseClient; // Supabase client is now a direct prop
  userId: string; // User ID is now a direct prop
}

export function StreakModal({
  isOpen,
  onClose,
  supabase,
  userId,
}: StreakModalProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch data only when the modal is opened
    if (isOpen) {
      const fetchStreakData = async () => {
        setIsLoading(true);
        try {
          // Concurrently fetch profile and journal entries
          const [profile, journalEntries] = await Promise.all([
            getProfileByUserId(supabase, userId),
            getJournalEntriesByUserId(supabase, userId)
          ]);

          // --- Calculate active days (logic adapted from StreakManagement) ---
          const getLocalYYYYMMDD = (date: Date): string => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
          };
          
          const dayMapping: ReadonlyArray<"Su" | "M" | "Tu" | "W" | "Th" | "F" | "Sa"> = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
          const daysWithEntriesInWindow = new Set<"M" | "Tu" | "W" | "Th" | "F" | "Sa" | "Su">();
          const now = new Date();
          const startOfToday = new Date(now);
          startOfToday.setHours(0,0,0,0);
          
          const allEntryYYYYMMDD = new Set(
            (journalEntries || []).map(entry => {
              const entryDate = new Date(entry.created_at?.toString() || "");
              return getLocalYYYYMMDD(entryDate);
            })
          );

          for (let i = 0; i < 7; i++) {
            const dateToCheck = new Date(startOfToday);
            dateToCheck.setDate(startOfToday.getDate() - i);
            const localDateToCheckYYYYMMDD = getLocalYYYYMMDD(dateToCheck);
            if (allEntryYYYYMMDD.has(localDateToCheckYYYYMMDD)) {
              daysWithEntriesInWindow.add(dayMapping[dateToCheck.getDay()]);
            }
          }

          const orderReference: Array<"M" | "Tu" | "W" | "Th" | "F" | "Sa" | "Su"> = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];
          const finalActiveDays = orderReference.filter(day => daysWithEntriesInWindow.has(day));
          // --- End of calculation ---

          // Set the processed data into state
          setStreakData({
            currentStreak: profile?.current_journal_streak || 0,
            activeDaysOfWeek: finalActiveDays,
            lastEntryDateDisplay: profile?.last_entry_date ? new Date(profile.last_entry_date).toLocaleDateString() : undefined,
          });

        } catch (error) {
          console.error("Failed to fetch streak data:", error);
          setStreakData(null); // Clear data on error
        } finally {
          setIsLoading(false);
        }
      };

      fetchStreakData();
    }
  }, [isOpen, supabase, userId]); // Effect runs when isOpen, supabase, or userId changes

  if (!isOpen) return null;

  const daysMap: Record<string, boolean> = {
    M: streakData?.activeDaysOfWeek.includes("M") ?? false,
    Tu: streakData?.activeDaysOfWeek.includes("Tu") ?? false,
    W: streakData?.activeDaysOfWeek.includes("W") ?? false,
    Th: streakData?.activeDaysOfWeek.includes("Th") ?? false,
    F: streakData?.activeDaysOfWeek.includes("F") ?? false,
    Sa: streakData?.activeDaysOfWeek.includes("Sa") ?? false,
    Su: streakData?.activeDaysOfWeek.includes("Su") ?? false,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl w-[600px] overflow-hidden transform transition-all">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
            <p className="text-2xl text-[#2F2569]">Loading fresh streak data...</p>
          </div>
        ) : !streakData ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
            <p className="text-xl text-red-500">Could not load streak data.</p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-5 bg-[#E5D1FE] rounded-xl text-[#9645FF] text-2xl font-medium hover:bg-[#d9bbff] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center">
            <div className="relative mb-8">
              <img
                src={beanLogo}
                alt="Bean Logo"
                className="w-48 h-48 scale-150 ml-[-1rem] mr-[1rem]"
              />
              <div className="absolute inset-0 mt-[5.75rem] flex items-center justify-center">
                <span className="text-white text-6xl font-bold">
                  {streakData.currentStreak}
                </span>
              </div>
            </div>
            {streakData.lastEntryDateDisplay && (
              <p className="text-[#2F2569] text-lg mb-2">
                Last entry: {streakData.lastEntryDateDisplay}
              </p>
            )}
            <p className="text-[#2F2569] text-xl mb-6 font-medium">
              You're on a {streakData.currentStreak}-day streak!
            </p>
            <div className="flex justify-between w-full mb-8 px-8 font-montserrat font-bold">
              {Object.entries(daysMap).map(([day, isActive]) => (
                <div className="flex flex-col items-center" key={day}>
                  <span
                    className={`text-3xl mb-2 ${isActive ? "text-[#A192F8]" : "text-[#ADA0F9]"}`}
                  >
                    {day}
                  </span>
                  <div
                    className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${isActive ? "border-[#B6D78A] bg-[#B6D78A]" : "border-[#DBDBDB]"}`}
                  >
                    {isActive && (
                      <svg
                        width="16"
                        height="12"
                        viewBox="0 0 16 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 6L6 11L15 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[#2F2569] text-2xl mb-8 font-semibold">
              Write down your Bean Journey everyday
            </p>
            <button
              onClick={onClose}
              className="w-full py-5 bg-[#E5D1FE] rounded-xl text-[#9645FF] text-2xl font-medium hover:bg-[#d9bbff] transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 