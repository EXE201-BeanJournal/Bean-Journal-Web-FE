"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import DiaryCard from "@/components/diary/DiaryCard";
import DiaryDetailView from "@/components/diary/DiaryDetailView";
import { JournalEntry, Tag, Project } from "@/types/supabase";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useSupabase } from "@/contexts/SupabaseContext";
import {
  createJournalEntry,
  getJournalEntriesByUserId,
  updateJournalEntry,
  deleteJournalEntry,
} from "@/services/journalEntryService";
import { getTagsByUserId, getEntryTagsByEntryId } from "@/services/tagService";
import { getProjectsByUserId } from "@/services/projectService";
import { useNavigate, useSearch, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createGroq } from "@ai-sdk/groq";
import { Block } from "@blocknote/core";
import { generateText } from "ai";
import { DiaryCardSkeleton } from "@/components/diary/DiaryCardSkeleton";
import { DiaryDetailViewSkeleton } from "@/components/diary/DiaryDetailViewSkeleton";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import type { SupabaseClient } from "@supabase/supabase-js";

interface DiaryPageSearch {
  createNew?: boolean;
  entryId?: string;
}

interface JournalEntryWithTags extends JournalEntry {
  tag_ids?: string[];
}

interface DiaryVirtualListProps {
  diaries: JournalEntryWithTags[];
  onSelectDiary: (id: string) => void;
  selectedDiaryId: string | null;
  supabase: SupabaseClient | null;
}

interface OptimizedCalendarProps {
  calendarDays: (number | null)[];
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  currentYear: number;
  currentMonth: number;
}

const getContrastColor = (hexcolor?: string): string => {
  if (!hexcolor) return "#000000";
  hexcolor = hexcolor.replace("#", "");
  if (hexcolor.length === 3) {
    hexcolor = hexcolor
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (hexcolor.length !== 6) {
    return "#000000";
  }
  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 4), 16);
  const b = parseInt(hexcolor.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "#000000";
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const sortDiariesByEntryTimestamp = (
  a: JournalEntryWithTags,
  b: JournalEntryWithTags
) => {
  const tsA = a.entry_timestamp;
  const tsB = b.entry_timestamp;

  if (tsA === null && tsB === null) return 0;
  if (tsA === null) return 1;
  if (tsB === null) return -1;

  const dateA = new Date(tsA).getTime();
  const dateB = new Date(tsB).getTime();

  const aIsNaN = isNaN(dateA);
  const bIsNaN = isNaN(dateB);

  if (aIsNaN && bIsNaN) return 0;
  if (aIsNaN) return 1;
  if (bIsNaN) return -1;

  return dateB - dateA;
};

const DiaryVirtualList: React.FC<DiaryVirtualListProps> = ({
  diaries,
  onSelectDiary,
  selectedDiaryId,
  supabase,
}) => {
  const itemHeight = 120;
  const containerHeight = Math.min(600, window.innerHeight - 300);

  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => (
      <div style={style}>
        <DiaryCard
          diary={diaries[index]}
          onSelectDiary={onSelectDiary}
          isSelected={diaries[index].id === selectedDiaryId}
          supabase={supabase!}
          updated_at={diaries[index].updated_at}
        />
      </div>
    ),
    [diaries, onSelectDiary, selectedDiaryId, supabase]
  );

  if (diaries.length === 0 || !supabase) return null;

  return (
    <List
      height={containerHeight}
      itemCount={diaries.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
};

const OptimizedCalendar: React.FC<OptimizedCalendarProps> = ({
  calendarDays,
  selectedDate,
  onDateChange,
  currentYear,
  currentMonth,
}) => {
  const today = useMemo(() => new Date(), []);

  const visibleDays = useMemo(() => {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() - 7);

    return calendarDays.filter((day: number | null, index: number) => {
      if (!day) return index < 35;
      const dayDate = new Date(currentYear, currentMonth, day);
      const weeksDiff =
        Math.abs(dayDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24 * 7);
      return weeksDiff <= 3;
    });
  }, [calendarDays, currentYear, currentMonth, today]);

  return (
    <div className="grid grid-cols-7 gap-1">
      {visibleDays.map((day: number | null, index: number) => {
        const isToday =
          day &&
          new Date(currentYear, currentMonth, day).toDateString() ===
            today.toDateString();
        const isSelectedDate =
          day &&
          selectedDate &&
          new Date(currentYear, currentMonth, day).toDateString() ===
            selectedDate.toDateString();

        return (
          <button
            key={index}
            onClick={() =>
              day && onDateChange(new Date(currentYear, currentMonth, day))
            }
            disabled={!day}
            className={`p-1.5 sm:p-2 rounded-full w-full aspect-square flex items-center justify-center text-xs sm:text-sm transition-colors
              ${!day ? "bg-transparent cursor-default" : "hover:bg-slate-200 dark:hover:bg-slate-700"}
              ${
                isSelectedDate
                  ? "bg-primary text-primary-foreground ring-2 ring-primary dark:bg-green-600/80 dark:text-white"
                  : isToday
                    ? "bg-primary/30 text-primary-foreground dark:bg-green-500/50 dark:text-white font-semibold"
                    : "text-slate-700 dark:text-gray-300"
              }
            `}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
};

const DiaryPage = () => {
  const { userId } = useAuth();
  const { user } = useUser();
  const supabase = useSupabase();

  const [isLoading, setIsLoading] = useState(true);
  const [diaries, setDiaries] = useState<JournalEntryWithTags[]>([]);
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [allUserTags, setAllUserTags] = useState<Tag[]>([]);
  const [activeFilterTagIds, setActiveFilterTagIds] = useState<string[]>([]);
  const [allUserProjects, setAllUserProjects] = useState<Project[]>([]);
  const [activeFilterProjectId, setActiveFilterProjectId] = useState<
    string | null
  >(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(false);
  const [canCreateNewDiary, setCanCreateNewDiary] = useState(true);

  const navigate = useNavigate();
  const routerLocation = useRouterState({ select: (s) => s.location });
  const search: DiaryPageSearch = useSearch({ from: "/journal/diary" });

  const createNewHandledRef = useRef(false);
  const entryIdFromUrlRef = useRef<string | null>(null);

  const hasUnlimitedAccess = useMemo(
    () => user?.publicMetadata?.unlimited_journals_entries === true,
    [user]
  );

  useEffect(() => {
    if (user && diaries) {
      if (!hasUnlimitedAccess) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diariesCreatedToday = diaries.filter((diary) => {
          if (!diary.entry_timestamp) return false;
          const entryDate = new Date(diary.entry_timestamp);
          return entryDate.toDateString() === today.toDateString();
        });

        setCanCreateNewDiary(diariesCreatedToday.length < 1);
      } else {
        setCanCreateNewDiary(true);
      }
    }
  }, [diaries, user, hasUnlimitedAccess]);

  const handleCreateNew = useCallback(async () => {
    if (!canCreateNewDiary || !userId || !supabase) {
      setError("User not authenticated or Supabase client not available.");
      return;
    }
    try {
      const newEntryBasics: Partial<JournalEntryWithTags> = {
        user_id: userId,
        entry_timestamp: new Date().toISOString(),
        title: "New Draft Diary",
        content: "",
        manual_mood_label: "neutral",
        is_draft: true,
        project_id: activeFilterProjectId || undefined,
      };
      const newDiaryEntry = await createJournalEntry(
        supabase,
        newEntryBasics as Partial<JournalEntry>
      );
      if (newDiaryEntry && newDiaryEntry.id) {
        setDiaries((prevDiaries) =>
          [{ ...newDiaryEntry, tag_ids: [] }, ...prevDiaries].sort(
            sortDiariesByEntryTimestamp
          )
        );
        setSelectedDiaryId(newDiaryEntry.id);
      } else {
        setError("Failed to create new diary entry in the database.");
      }
    } catch (err) {
      console.error("Error creating new diary:", err);
      setError("An error occurred while creating the new diary.");
    }
  }, [userId, supabase, activeFilterProjectId, canCreateNewDiary]);

  useEffect(() => {
    if (search.createNew === true) {
      if (!createNewHandledRef.current) {
        if (userId && supabase) {
          createNewHandledRef.current = true;
          handleCreateNew();
          navigate({
            to: routerLocation.pathname,
            search: (prev: DiaryPageSearch) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { createNew, ...rest } = prev;
              return rest;
            },
            replace: true,
          });
        } else {
          navigate({
            to: routerLocation.pathname,
            search: (prev: DiaryPageSearch) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { createNew, ...rest } = prev;
              return rest;
            },
            replace: true,
          });
        }
      }
    } else {
      createNewHandledRef.current = false;
    }
  }, [
    search.createNew,
    userId,
    supabase,
    handleCreateNew,
    navigate,
    routerLocation.pathname,
  ]);

  useEffect(() => {
    if (search.entryId) {
      if (entryIdFromUrlRef.current !== search.entryId) {
        entryIdFromUrlRef.current = search.entryId;
      }

      if (!isLoading && diaries.length > 0 && entryIdFromUrlRef.current) {
        const diaryToSelect = diaries.find(
          (d) => d.id === entryIdFromUrlRef.current
        );
        if (diaryToSelect) {
          setSelectedDiaryId(diaryToSelect.id!);
        } else {
          console.warn(
            `Diary with ID ${entryIdFromUrlRef.current} from URL not found.`
          );
        }

        navigate({
          to: routerLocation.pathname,
          search: (prevSearch: DiaryPageSearch) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { entryId, ...rest } = prevSearch;
            return rest;
          },
          replace: true,
        });
        entryIdFromUrlRef.current = null;
      }
    } else {
      entryIdFromUrlRef.current = null;
    }
  }, [
    search.entryId,
    diaries,
    isLoading,
    navigate,
    routerLocation.pathname,
    setSelectedDiaryId,
  ]);

  useEffect(() => {
    if (userId && supabase) {
      const startTime = Date.now();
      const minDisplayTime = 1000;

      const fetchData = async () => {
        try {
          const [fetchedDiaries, tags, projects] = await Promise.all([
            getJournalEntriesByUserId(supabase, userId),
            getTagsByUserId(supabase, userId),
            getProjectsByUserId(supabase, userId),
          ]);

          if (fetchedDiaries) {
            const diariesWithTagsPromises = fetchedDiaries.map(
              async (diary) => {
                if (!diary.id) return { ...diary, tag_ids: [] };
                try {
                  const entryTags = await getEntryTagsByEntryId(
                    supabase,
                    diary.id
                  );
                  const tagIds = entryTags.map((et) => et.tag_id);
                  return { ...diary, tag_ids: tagIds };
                } catch (tagError) {
                  console.error(
                    `Error fetching tags for diary ${diary.id}:`,
                    tagError
                  );
                  return { ...diary, tag_ids: [] };
                }
              }
            );

            const diariesWithTags = await Promise.all(diariesWithTagsPromises);
            const sortedDiaries = diariesWithTags.sort(
              sortDiariesByEntryTimestamp
            );
            setDiaries(sortedDiaries);

            const isMobile = window.matchMedia("(max-width: 767px)").matches;
            if (sortedDiaries.length > 0 && !entryIdFromUrlRef.current) {
              !isMobile &&
                setSelectedDiaryId((currentSelectedId) =>
                  currentSelectedId === null
                    ? sortedDiaries[0].id!
                    : currentSelectedId
                );
            } else if (sortedDiaries.length === 0) {
              setSelectedDiaryId(null);
            }
          } else {
            setDiaries([]);
            setSelectedDiaryId(null);
          }

          setAllUserTags(tags || []);
          setAllUserProjects(projects || []);
        } catch (err) {
          console.error("Error fetching initial data:", err);
          setError("Failed to load data. Please try refreshing the page.");
        } finally {
          const elapsedTime = Date.now() - startTime;
          const remainingTime = minDisplayTime - elapsedTime;
          if (remainingTime > 0) {
            setTimeout(() => setIsLoading(false), remainingTime);
          } else {
            setIsLoading(false);
          }
        }
      };

      fetchData();
    }
  }, [userId, supabase]);

  const handleSelectDiary = useCallback((id: string) => {
    setSelectedDiaryId(id);
  }, []);

  const handleUpdateDiary = useCallback(
    async (updates: Partial<JournalEntry>) => {
      if (!selectedDiaryId || !supabase) {
        setError(
          "No diary selected or Supabase client not available for update."
        );
        throw new Error("Update preconditions not met.");
      }
      try {
        const updatedEntry = await updateJournalEntry(
          supabase,
          selectedDiaryId,
          updates
        );
        if (updatedEntry) {
          setDiaries((prevDiaries) =>
            prevDiaries
              .map((d) =>
                d.id === selectedDiaryId ? { ...d, ...updatedEntry } : d
              )
              .sort(sortDiariesByEntryTimestamp)
          );
        } else {
          setError("Failed to save updates to the database.");
          throw new Error("Failed to save updates to the database.");
        }
      } catch (err) {
        console.error("Error updating diary in page:", err);
        setError("An error occurred while saving your changes.");
        throw err;
      }
    },
    [selectedDiaryId, supabase]
  );

  const handleDeleteDiary = useCallback(
    async (diaryIdToDelete: string) => {
      if (!supabase) {
        setError("Supabase client not available for delete.");
        throw new Error("Delete preconditions not met.");
      }
      if (!diaryIdToDelete) {
        setError("No diary ID provided for deletion.");
        throw new Error("No diary ID provided for deletion.");
      }

      try {
        await deleteJournalEntry(supabase, diaryIdToDelete);
        setDiaries((prevDiaries) => {
          const remainingDiaries = prevDiaries.filter(
            (d) => d.id !== diaryIdToDelete
          );
          if (remainingDiaries.length > 0) {
            if (selectedDiaryId === diaryIdToDelete) {
              setSelectedDiaryId(remainingDiaries[0].id!);
            }
          } else {
            setSelectedDiaryId(null);
          }
          return remainingDiaries;
        });
      } catch (err) {
        console.error("Error deleting diary in page:", err);
        setError("An error occurred while deleting the diary.");
        throw err;
      }
    },
    [supabase, selectedDiaryId]
  );

  const handleTagFilterClick = useCallback((tagId: string) => {
    setActiveFilterTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  const handleProjectFilterClick = useCallback((projectId: string | null) => {
    setActiveFilterProjectId((prev) => (prev === projectId ? null : projectId));
  }, []);

  const calendarDateForLogic = selectedDate || new Date();
  const currentMonthName = calendarDateForLogic.toLocaleString("default", {
    month: "long",
  });
  const currentYear = calendarDateForLogic.getFullYear();
  const daysInMonth = new Date(
    calendarDateForLogic.getFullYear(),
    calendarDateForLogic.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    calendarDateForLogic.getFullYear(),
    calendarDateForLogic.getMonth(),
    1
  ).getDay();

  const getDaysArrayForMonth = useCallback(() => {
    const daysArray: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }
    return daysArray;
  }, [firstDayOfMonth, daysInMonth]);

  const calendarDays = getDaysArrayForMonth();

  const handleCalendarDateChange = useCallback((newDate: Date) => {
    setSelectedDate(newDate);
  }, []);

  const handleMonthChange = useCallback((increment: number) => {
    setSelectedDate((prevDate) => {
      const current = prevDate || new Date();
      return new Date(current.getFullYear(), current.getMonth() + increment, 1);
    });
  }, []);

  const filteredDiaries = useMemo(() => {
    let tempDiaries = diaries;

    if (searchQuery) {
      tempDiaries = tempDiaries.filter((diary) =>
        diary.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilterTagIds.length > 0) {
      tempDiaries = tempDiaries.filter((diary) => {
        const d = diary as JournalEntryWithTags;
        const diaryTagIds = d.tag_ids;
        const matches =
          diaryTagIds &&
          Array.isArray(diaryTagIds) &&
          diaryTagIds.some((tagId: string) =>
            activeFilterTagIds.includes(tagId)
          );
        return matches;
      });
    }

    if (activeFilterProjectId) {
      tempDiaries = tempDiaries.filter(
        (diary) => diary.project_id === activeFilterProjectId
      );
    }

    if (selectedDate && !(selectedDate instanceof Array)) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);

      tempDiaries = tempDiaries.filter((diary) => {
        const entryDate = new Date(diary.entry_timestamp);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === filterDate.getTime();
      });
    }

    return tempDiaries;
  }, [
    diaries,
    searchQuery,
    activeFilterTagIds,
    selectedDate,
    activeFilterProjectId,
  ]);

  const selectedDiary = filteredDiaries.find(
    (diary) => diary.id === selectedDiaryId
  );
  const currentSelectedDiary =
    selectedDiary || diaries.find((d) => d.id === selectedDiaryId);

  const extractTextFromBlockContent = useCallback(
    (content: unknown[]): string => {
      return content
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            const objItem = item as Record<string, unknown>;
            if (objItem.type === "link" && Array.isArray(objItem.content)) {
              return extractTextFromBlockContent(objItem.content);
            }
            return typeof objItem.text === "string" ? objItem.text : "";
          }
          return "";
        })
        .join("");
    },
    []
  );

  const handleGenerateSummary = useCallback(async () => {
    if (!filteredDiaries.length) {
      setAiSummary("No entries for this day to summarize.");
      return;
    }

    setIsAiSummaryLoading(true);
    setAiSummary(null);

    try {
      const groq = createGroq({
        apiKey: "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",
      });

      const combinedContent = filteredDiaries
        .map((diary) => {
          if (!diary.content) return "";
          try {
            const blocks: Block[] = JSON.parse(diary.content as string);
            return blocks
              .map((block) => {
                if (block.type === "paragraph" && block.content) {
                  return extractTextFromBlockContent(block.content);
                }
                return "";
              })
              .join("\n");
          } catch (e) {
            if (typeof diary.content === "string") {
              return diary.content;
            }
            console.error("Error parsing diary content:", e);
            return "";
          }
        })
        .join("\n\n");

      if (combinedContent.trim().length < 20) {
        setAiSummary("Not enough content to generate a summary.");
        setIsAiSummaryLoading(false);
        return;
      }

      const { text } = await generateText({
        model: groq("llama3-8b-8192"),
        prompt: `Please provide a concise summary of the following journal entries for the day. The summary should be a single paragraph, highlighting the main activities, moods, and any significant events or thoughts. Entries are separated by newlines. Do not use markdown or special formatting. Just return the summary text:\n\n${combinedContent}`,
      });

      setAiSummary(text);
    } catch (error) {
      console.error("Error generating AI summary:", error);
      setAiSummary("Failed to generate summary. Please try again.");
    } finally {
      setIsAiSummaryLoading(false);
    }
  }, [filteredDiaries, extractTextFromBlockContent]);

  if (!userId) {
    return (
      <div className="p-8 text-center">
        Please sign in to view your diaries.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-100px)] bg-slate-50 text-foreground">
        <aside className="w-full md:w-1/3 lg:w-1/4 p-4 md:p-6 border-r border-slate-200 overflow-y-auto bg-white">
          <div className="space-y-4">
            <DiaryCardSkeleton />
            <DiaryCardSkeleton />
            <DiaryCardSkeleton />
          </div>
        </aside>
        <main className="flex-1 w-full md:w-2/3 lg:w-3/4 p-4 md:p-8 overflow-y-auto bg-[#E4EFE7]/50 rounded-tl-2xl md:rounded-tl-none">
          <DiaryDetailViewSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-100px)] bg-slate-50 text-foreground">
      <aside
        className={`w-full md:w-1/3 lg:w-1/4 p-4 md:p-6 border-r border-slate-200 overflow-y-auto bg-white ${selectedDiaryId ? "hidden md:block" : "block"}`}
      >
        <header className="mb-6">
          <h1
            className="text-xl font-normal text-slate-500 mb-1"
            style={{ fontFamily: "Readex Pro, sans-serif" }}
          >
            My diaries
          </h1>

          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="w-full mt-3 mb-3">
                  <button
                    onClick={handleCreateNew}
                    disabled={!canCreateNewDiary}
                    className="w-full px-4 py-2 text-sm font-medium text-black bg-[#DAE6D4] rounded-lg hover:bg-[#DAE6D4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DAE6D4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Create New Diary
                  </button>
                </div>
              </TooltipTrigger>
              {!canCreateNewDiary && (
                <TooltipContent>
                  <p className="text-sm font-semibold">
                    Free plan limit reached.
                  </p>
                  <p className="text-xs">
                    You can create one diary per day. Upgrade for unlimited
                    entries.
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <div className="relative mt-2">
            <input
              type="text"
              placeholder="Search diaries by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-[#DAE6D4] focus:border-[#DAE6D4] bg-white text-slate-700 placeholder-slate-400"
              style={{ fontFamily: "Readex Pro, sans-serif", fontSize: "14px" }}
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="mt-4">
            <h2
              className="text-sm font-medium text-slate-500 mb-2"
              style={{ fontFamily: "Readex Pro, sans-serif" }}
            >
              Filter by Tags:
            </h2>
            {allUserTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allUserTags.slice(0, 8).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagFilterClick(tag.id!)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors duration-150 ease-in-out shadow-sm`}
                    style={
                      activeFilterTagIds.includes(tag.id!)
                        ? {
                            backgroundColor: tag.color_hex || "#007AFF",
                            color: getContrastColor(tag.color_hex || "#007AFF"),
                            borderColor: tag.color_hex || "#007AFF",
                          }
                        : {
                            backgroundColor: "#F3F4F6",
                            color: "#374151",
                            borderColor: "#D1D5DB",
                            fontFamily: "Readex Pro, sans-serif",
                          }
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <p
                className="text-xs text-slate-400"
                style={{ fontFamily: "Readex Pro, sans-serif" }}
              >
                No tags created yet.
              </p>
            )}
          </div>

          <div className="mt-4">
            <h2
              className="text-sm font-medium text-slate-500 mb-2"
              style={{ fontFamily: "Readex Pro, sans-serif" }}
            >
              Filter by Project:
            </h2>
            {allUserProjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allUserProjects.slice(0, 6).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectFilterClick(project.id!)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors duration-150 ease-in-out shadow-sm`}
                    style={
                      activeFilterProjectId === project.id!
                        ? {
                            backgroundColor: project.color_hex || "#007AFF",
                            color: getContrastColor(
                              project.color_hex || "#007AFF"
                            ),
                            borderColor: project.color_hex || "#007AFF",
                          }
                        : {
                            backgroundColor: "#F3F4F6",
                            color: "#374151",
                            borderColor: "#D1D5DB",
                            fontFamily: "Readex Pro, sans-serif",
                          }
                    }
                  >
                    {project.name}
                  </button>
                ))}
                <button
                  onClick={() => handleProjectFilterClick(null)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors duration-150 ease-in-out shadow-sm ${!activeFilterProjectId ? "bg-slate-500 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                  style={{ fontFamily: "Readex Pro, sans-serif" }}
                >
                  All Projects
                </button>
              </div>
            ) : (
              <p
                className="text-xs text-slate-400"
                style={{ fontFamily: "Readex Pro, sans-serif" }}
              >
                No projects created yet.
              </p>
            )}
          </div>

          <div className="mt-6 bg-white/70 dark:bg-slate-800/70 p-1 sm:p-2 md:p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h4
                className="text-base sm:text-lg font-semibold text-[#2F2569] dark:text-green-300"
                style={{ fontFamily: "Readex Pro, sans-serif" }}
              >
                {currentMonthName} {currentYear}
              </h4>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleMonthChange(-1)}
                  className="p-1.5 sm:p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => handleMonthChange(1)}
                  className="p-1.5 sm:p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleGenerateSummary}
                disabled={isAiSummaryLoading || filteredDiaries.length === 0}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isAiSummaryLoading ? "Generating..." : "Generate AI Summary"}
              </button>
              {aiSummary && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {aiSummary}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mt-4">
              {daysOfWeek.map((day) => (
                <div key={day}>{day.slice(0, 2)}</div>
              ))}
            </div>
            <OptimizedCalendar
              calendarDays={calendarDays}
              selectedDate={selectedDate}
              onDateChange={handleCalendarDateChange}
              currentYear={currentYear}
              currentMonth={calendarDateForLogic.getMonth()}
            />
            <button
              onClick={() => setSelectedDate(null)}
              className="w-full mt-3 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-slate-400 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Show All Dates
            </button>
          </div>
        </header>

        {error ? (
          <p className="text-red-500 text-center py-10">{error}</p>
        ) : filteredDiaries.length > 0 ? (
          <DiaryVirtualList
            diaries={filteredDiaries}
            onSelectDiary={handleSelectDiary}
            selectedDiaryId={selectedDiaryId}
            supabase={supabase}
          />
        ) : searchQuery &&
          diaries.length > 0 &&
          filteredDiaries.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            No diaries match your search "{searchQuery}".
          </p>
        ) : activeFilterTagIds.length > 0 && filteredDiaries.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            No diaries match your selected tags.
          </p>
        ) : selectedDate && filteredDiaries.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            No diaries found for {selectedDate.toLocaleDateString()}.
          </p>
        ) : activeFilterProjectId && filteredDiaries.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            No diaries found for the selected project.
          </p>
        ) : diaries.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            No diaries yet. Click "Create New Diary" to start!
          </p>
        ) : (
          <p className="text-slate-500 text-center py-10">
            No diaries match your current filters.
          </p>
        )}
      </aside>

      <main
        className={`flex-1 w-full md:w-2/3 lg:w-3/4 p-4 md:p-8 overflow-y-auto bg-[#E4EFE7]/50 rounded-tl-2xl md:rounded-tl-none ${selectedDiaryId ? "block" : "hidden md:block"}`}
      >
        {selectedDiaryId && (
          <button
            onClick={() => setSelectedDiaryId(null)}
            className="md:hidden mb-4 flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800"
            aria-label="Back to diary list"
          >
            <ChevronLeft size={18} className="mr-1" />
            Back to Diary List
          </button>
        )}
        {currentSelectedDiary && supabase ? (
          <DiaryDetailView
            key={currentSelectedDiary.id}
            diary={currentSelectedDiary}
            onUpdateDiary={handleUpdateDiary}
            onDeleteDiary={handleDeleteDiary}
            userId={userId}
            supabase={supabase}
            hasUnlimitedAccess={hasUnlimitedAccess}
          />
        ) : diaries.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-semibold text-slate-600">
              Create your first diary!
            </h2>
            <button
              onClick={handleCreateNew}
              className="mt-4 px-6 py-3 text-lg font-medium text-white bg-primary hover:bg-primary/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus transition-colors"
            >
              Create Your First Diary
            </button>
          </div>
        ) : filteredDiaries.length === 0 &&
          (selectedDate ||
            searchQuery ||
            activeFilterTagIds.length > 0 ||
            activeFilterProjectId) ? (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-semibold text-slate-600">
              No Matching Diaries
            </h2>
            <p className="text-slate-500 mt-2">
              No diaries match your current filters. Try adjusting your search,
              tags, or selected date.
            </p>
          </div>
        ) : !currentSelectedDiary && filteredDiaries.length > 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-semibold text-slate-600">
              Select a diary to view
            </h2>
            <p className="text-slate-500 mt-2">
              Choose a diary from the list on the left.
            </p>
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-semibold text-slate-600">
              Select a diary to view or create a new one.
            </h2>
          </div>
        )}
      </main>
    </div>
  );
};

export default DiaryPage;
