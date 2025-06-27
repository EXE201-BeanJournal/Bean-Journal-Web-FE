import React, { useEffect, useState } from "react";
import { getProjectById } from "@/services/projectService";
import { getJournalEntriesByProjectId } from "@/services/journalEntryService";
import type { Project, JournalEntry, TodoItem } from "@/types/supabase";
import { useSupabase } from "@/contexts/SupabaseContext";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ListTodo,
  Plus,
  BookText,
} from "lucide-react";
import { moodOptions } from "@/components/diary/MoodSelector";
import { Image as ImageIcon } from "lucide-react";
import { ProjectPageSkeleton } from "@/components/skeletons/ProjectPageSkeleton";

// Helper function to parse BlockNote JSON content (copied from user-profile/page.tsx)
const parseBlockNoteJsonContent = (
  jsonContent: string | undefined | null
): { textContent: string; imageUrl: string | null } => {
  if (!jsonContent) return { textContent: "", imageUrl: null };
  try {
    const blocks = JSON.parse(jsonContent);
    let readableContent = "";
    let firstImageUrl: string | null = null;

    if (Array.isArray(blocks)) {
      for (const block of blocks) {
        if (block.type === "paragraph" && Array.isArray(block.content)) {
          for (const item of block.content) {
            if (item.type === "text" && typeof item.text === "string") {
              readableContent += item.text + " ";
            }
          }
          readableContent += "\n";
        } else if (
          block.type === "image" &&
          block.props &&
          typeof block.props.url === "string"
        ) {
          if (!firstImageUrl) {
            firstImageUrl = block.props.url;
          }
        }
      }
    }
    return { textContent: readableContent.trim(), imageUrl: firstImageUrl };
  } catch (error) {
    console.error("Error parsing BlockNote JSON content:", error);
    return {
      textContent: typeof jsonContent === "string" ? jsonContent : "",
      imageUrl: null,
    };
  }
};

interface ProjectPageProps {
  projectId: string;
}

const ProjectPage: React.FC<ProjectPageProps> = ({ projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabase();

  useEffect(() => {
    if (!projectId || !supabase) {
      setIsLoading(false);
      setError(
        projectId
          ? "Could not initialize Supabase client."
          : "Project ID is missing."
      );
      return;
    }

    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [projectData, entriesData] = await Promise.all([
          getProjectById(supabase, projectId),
          getJournalEntriesByProjectId(supabase, projectId),
        ]);

        if (projectData) {
          setProject(projectData);
          setJournalEntries(entriesData || []);
        } else {
          setError("Project not found.");
          setProject(null);
          setJournalEntries([]);
        }
      } catch (err) {
        console.error("Error fetching project data:", err);
        setError("Failed to load project details.");
        setProject(null);
        setJournalEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, supabase]);

  if (isLoading) {
    return <ProjectPageSkeleton />;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!project) {
    return (
      <div className="p-4 text-center">
        Project could not be loaded or found.
      </div>
    );
  }
  
  const allTodos = journalEntries.flatMap((entry) => entry.todo_items || []);
  const completedTodosCount = allTodos.filter((t) => t.is_completed).length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        day: "2-digit",
        weekday: "short",
        month: "short",
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 h-full flex flex-col gap-6">
      {/* Project Header */}
      <header className="p-4 md:p-5 bg-white dark:bg-gray-800 rounded-lg shadow-md flex-shrink-0">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3 flex-grow">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color_hex || "#7DD3FC" }}
            ></div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white truncate">
              {project.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="px-3 py-1.5 text-sm font-semibold rounded-md shadow-sm flex items-center gap-1.5 bg-sky-500 text-white hover:bg-sky-600 transition-colors">
              <Plus size={16} /> New Entry
            </button>
          </div>
        </div>
        {project.description && (
          <p className="text-sm md:text-md text-gray-600 dark:text-gray-300 pt-3">
            {project.description}
          </p>
        )}
        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 pt-3 flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <BookText size={14} />
            {journalEntries.length} Journal Entries
          </span>
          <span className="flex items-center gap-1.5">
            <ListTodo size={14} />
            {allTodos.length} To-Do Items ({completedTodosCount} Complete)
          </span>
        </div>
      </header>
      
      {/* Main Content Area - Original Card Layout */}
      <section className="flex-grow min-h-0 overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Associated Diaries
        </h2>
        {journalEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journalEntries.map((entry) => {
              const moodOption = entry.manual_mood_label
                ? moodOptions.find((m) => m.value === entry.manual_mood_label)
                : null;
              const { imageUrl, textContent } = parseBlockNoteJsonContent(
                entry.content
              );
              const todos = entry.todo_items || [];
              const completedTodos = todos.filter((t) => t.is_completed).length;

              return (
                <div
                  key={entry.id}
                  className="rounded-lg shadow-md flex flex-col group text-gray-800 dark:text-gray-100 transition-all duration-200 ease-in-out border bg-[#F5F8F4] hover:bg-[#E9F0E6] border-[#DDE8DA] hover:border-[#CFE0CA] dark:bg-slate-800/70 dark:hover:bg-slate-800/90 dark:border-slate-700 dark:hover:border-slate-600"
                >
                  <Link
                    to={`/journal/diary`}
                    search={{ entryId: entry.id }}
                    className="block p-4"
                  >
                    <div className="flex gap-4 items-start">
                      {/* Image Section (Left) */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-200 dark:bg-slate-700/50 rounded-lg flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Diary image"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon
                            size={32}
                            className="text-gray-400 dark:text-slate-500"
                          />
                        )}
                      </div>

                      {/* Content Section (Right) */}
                      <div className="flex-grow flex flex-col min-w-0 h-full">
                        <div className="flex justify-between items-start mb-1">
                          <h3
                            className="text-lg font-semibold text-slate-700 dark:text-slate-200 truncate mr-2 flex-grow"
                            style={{ fontFamily: "Readex Pro, sans-serif" }}
                          >
                            {entry.title || "Untitled Entry"}
                          </h3>
                          {moodOption && (
                            <img
                              src={moodOption.emojiPath}
                              alt={moodOption.label}
                              className="w-6 h-6 flex-shrink-0"
                              title={`Mood: ${moodOption.label}`}
                            />
                          )}
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                          {textContent}
                        </p>
                        <div className="flex-grow"></div>
                        <div
                          className="flex items-center text-xs text-slate-400 dark:text-slate-500 pt-1"
                          style={{ fontFamily: "Readex Pro, sans-serif" }}
                        >
                          <CalendarDays
                            size={14}
                            className="mr-1.5 flex-shrink-0"
                          />
                          <span>{formatDate(entry.entry_timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {/* To-do List Section */}
                  {todos.length > 0 && (
                    <div className="border-t border-[#DDE8DA] dark:border-slate-700 mt-2 pt-3 pb-4 px-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                          <ListTodo size={16} className="mr-2" />
                          <span>To-Do List</span>
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {completedTodos}/{todos.length} Done
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {todos.slice(0, 3).map((todo: TodoItem) => ( // Show max 3 todos
                          <li
                            key={todo.id}
                            className="flex items-center text-sm text-slate-600 dark:text-slate-300"
                          >
                            {todo.is_completed ? (
                              <CheckCircle2
                                size={14}
                                className="mr-2 flex-shrink-0 text-green-500"
                              />
                            ) : (
                              <Circle
                                size={14}
                                className="mr-2 flex-shrink-0 text-slate-400"
                              />
                            )}
                            <span className={`truncate ${todo.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                              {todo.task_description}
                            </span>
                          </li>
                        ))}
                        {todos.length > 3 && (
                            <li className="text-xs text-center text-slate-500 dark:text-slate-400 pt-1">
                                +{todos.length - 3} more...
                            </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-6 text-gray-500 dark:text-gray-400">
            No journal entries found for this project yet.
          </p>
        )}
      </section>
    </div>
  );
};

export default ProjectPage;
