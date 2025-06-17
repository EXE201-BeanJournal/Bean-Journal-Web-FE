import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  Search
} from "lucide-react";

export function TodoPageSkeleton() {
  const TaskItemSkeleton = () => (
    <li className="bg-white/90 dark:bg-slate-800/90 p-4 rounded-xl shadow-md flex items-start space-x-4">
      <Skeleton className="mt-1 w-5 h-5 rounded" />
      <div className="flex-grow">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <div className="flex items-center space-x-2 text-xs">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="flex flex-col items-end space-y-1">
        <Skeleton className="h-7 w-24 rounded-md" />
        <div className="flex items-center space-x-0.5">
          <Skeleton className="w-7 h-7 rounded-md" />
          <Skeleton className="w-7 h-7 rounded-md" />
        </div>
      </div>
    </li>
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col text-gray-800 bg-gradient-to-b from-[#E4EFE7] to-white dark:text-gray-200 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
      <main className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-7xl mx-auto p-6 md:p-10 overflow-y-auto w-full">
        {/* Header Skeleton */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <div className="relative">
              <Skeleton className="h-10 w-64 rounded-md" />
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
            </div>
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task List Section Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add New Task Input Skeleton */}
            <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl shadow-lg flex items-center space-x-3">
              <PlusCircle
                size={24}
                className="text-black opacity-70 dark:opacity-100"
              />
              <Skeleton className="h-6 flex-grow bg-transparent" />
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>

            {/* Pending Tasks Skeleton */}
            <div>
              <Skeleton className="h-7 w-40 mb-4" />
              <ul className="space-y-3">
                <TaskItemSkeleton />
                <TaskItemSkeleton />
                <TaskItemSkeleton />
              </ul>
            </div>
          </div>

          {/* Calendar Section Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/70 dark:bg-slate-800/70 p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-7 w-48" />
                <div className="flex space-x-1">
                  <Skeleton className="w-8 h-8 rounded-md" />
                  <Skeleton className="w-8 h-8 rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div key={day}>{day}</div>
                  )
                )}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[...Array(35)].map((_, index) => (
                  <Skeleton
                    key={index}
                    className="p-2 rounded-full w-9 h-9"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 