import { Skeleton } from "@/components/ui/skeleton";

export function JournalCalendarSectionSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800/50">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-10 mx-auto" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
} 