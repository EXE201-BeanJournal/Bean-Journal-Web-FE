import ActivityCalendar from "@/components/ui/ActivityCalendar";
import type { JournalEntry } from "@/types/supabase";

interface ActivityCardProps {
  userJournalEntries: JournalEntry[];
}

const ActivityCard = ({ userJournalEntries }: ActivityCardProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Activity</h3>
      <div className="p-4 bg-white/30 dark:bg-slate-800/40 backdrop-blur-md rounded-lg shadow-lg">
        <ActivityCalendar
          journalEntries={userJournalEntries}
          colors={{
            light: "#ebedf0",
            dark: "#161b22",
            noActivity: "rgba(209, 213, 219, 0.3)",
          }}
        />
        <p className="text-center text-xs text-gray-500 mt-2">
          {userJournalEntries.length > 0
            ? "Journal activity based on your entries."
            : "No activity data yet. Write some entries!"}
        </p>
      </div>
    </div>
  );
};

export default ActivityCard; 