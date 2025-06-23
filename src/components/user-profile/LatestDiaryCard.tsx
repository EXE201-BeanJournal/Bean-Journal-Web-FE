import {
  CalendarDays,
  Edit3,
  ImageIcon,
  Share2,
  Tags as TagsIcon,
  Trash2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { JournalEntry, Tag } from "@/types/supabase";
import { Button } from "@/components/ui/Button";
import { moodOptions } from "@/components/diary/MoodSelector";

// Helper function to determine text color based on background brightness
const getContrastColor = (hexcolor?: string): string => {
  if (!hexcolor) return "#000000"; // Default to black if no color
  hexcolor = hexcolor.replace("#", "");
  if (hexcolor.length === 3) {
    hexcolor = hexcolor
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (hexcolor.length !== 6) {
    return "#000000"; // Fallback for invalid hex
  }
  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 4), 16);
  const b = parseInt(hexcolor.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF"; // Return black for light backgrounds, white for dark
};

interface LatestDiaryCardProps {
  latestDiary: JournalEntry | null;
  latestDiaryImageUrl: string | null;
  readableDiaryContent: string;
  latestDiaryTags: Tag[];
}

const LatestDiaryCard = ({
  latestDiary,
  latestDiaryImageUrl,
  readableDiaryContent,
  latestDiaryTags,
}: LatestDiaryCardProps) => {
  if (!latestDiary || !latestDiary.id) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-3 text-[#2F2569] dark:text-gray-200">
          Latest Diary
        </h2>
        <div className="p-4 rounded-lg border bg-[#F5F8F4] dark:bg-slate-700/70 border-[#DDE8DA] dark:border-slate-600 min-h-[100px] flex flex-col items-center justify-center">
          <ImageIcon
            size={32}
            className="text-slate-400 dark:text-slate-500 mb-2"
          />
          <p
            className="text-sm text-slate-500 dark:text-slate-400"
            style={{ fontFamily: "Readex Pro, sans-serif" }}
          >
            No diary entries yet or still loading...
          </p>
        </div>
      </div>
    );
  }
  return (
    <Link to="/journal/diary" className="block cursor-pointer group">
      <h2 className="text-xl font-semibold mb-3 text-[#2F2569] dark:text-gray-200">
        Latest Diary
      </h2>
      <div className="p-4 sm:p-5 rounded-lg shadow-md relative group text-gray-800 dark:text-gray-100 transition-all duration-200 ease-in-out border bg-[#F5F8F4] hover:bg-[#E9F0E6] border-[#DDE8DA] hover:border-[#CFE0CA] dark:bg-slate-700/70 dark:hover:bg-slate-700/90 dark:border-slate-600 dark:hover:border-slate-500">
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-3 md:col-span-2 flex items-center justify-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-300/50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center overflow-hidden">
              {latestDiaryImageUrl ? (
                <img
                  src={latestDiaryImageUrl}
                  alt="Latest diary image"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={32} className="text-gray-500" />
              )}
            </div>
          </div>

          <div className="col-span-9 md:col-span-7">
            {latestDiary.title && (
              <h3
                className="text-lg font-semibold mb-1 text-slate-700 dark:text-slate-200 truncate"
                style={{ fontFamily: "Readex Pro, sans-serif" }}
              >
                {latestDiary.title}
              </h3>
            )}
            <p
              className="text-sm leading-relaxed whitespace-pre-line line-clamp-3 group-hover:line-clamp-none text-slate-500 dark:text-slate-400 mb-2"
              style={{ fontFamily: "Readex Pro, sans-serif" }}
            >
              {readableDiaryContent || "Content not available."}
            </p>
            {latestDiaryTags.length > 0 && (
              <div className="mt-2 mb-2.5 flex flex-wrap gap-1.5 items-center">
                <TagsIcon
                  size={16}
                  className="text-slate-500 dark:text-slate-400"
                />
                {latestDiaryTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs px-2 py-1 rounded-md shadow-sm border border-black/10 dark:border-white/10"
                    style={{
                      fontFamily: "Readex Pro, sans-serif",
                      backgroundColor: tag.color_hex || "#E9E9E9",
                      color: getContrastColor(tag.color_hex || "#E9E9E9"),
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-12 md:col-span-3 flex flex-col items-center md:items-end mt-2 md:mt-0">
            {latestDiary.manual_mood_label && (
              <div className="flex flex-col items-center md:items-end mb-2">
                {(() => {
                  const moodOption = moodOptions.find(
                    (m) => m.value === latestDiary.manual_mood_label
                  );
                  return moodOption ? (
                    <img
                      src={moodOption.emojiPath}
                      alt={moodOption.label}
                      className="w-8 h-8 mb-1"
                      title={`Mood: ${moodOption.label}`}
                    />
                  ) : null;
                })()}
                <span
                  className="text-xs font-medium text-slate-600 dark:text-slate-400"
                  style={{ fontFamily: "Readex Pro, sans-serif" }}
                >
                  {latestDiary.manual_mood_label}
                </span>
              </div>
            )}
            <div
              className="flex items-center text-xs mt-1 text-slate-400 dark:text-slate-500"
              style={{ fontFamily: "Readex Pro, sans-serif" }}
            >
              <CalendarDays size={14} className="mr-1.5" />
              <span>
                {latestDiary.entry_timestamp
                  ? new Date(latestDiary.entry_timestamp).toLocaleDateString(
                      "en-US",
                      {
                        day: "2-digit",
                        weekday: "short",
                        month: "short",
                      }
                    )
                  : "Date unavailable"}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-black/20 rounded-full"
          >
            <Share2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-black/20 rounded-full"
          >
            <Edit3 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-red-500 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/30 rounded-full"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default LatestDiaryCard; 