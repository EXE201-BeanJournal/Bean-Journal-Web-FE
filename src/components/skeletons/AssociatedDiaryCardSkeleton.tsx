import { Skeleton } from "@/components/ui/skeleton";

export function AssociatedDiaryCardSkeleton() {
  return (
    <div className="p-4 rounded-lg shadow-md flex gap-4 items-start border bg-[#F5F8F4] dark:bg-slate-700/70 border-[#DDE8DA] dark:border-slate-600">
      <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg" />
      <div className="flex-grow flex flex-col min-w-0 h-full">
        <div className="flex justify-between items-start mb-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
        <div className="flex-grow"></div>
        <div className="flex items-center pt-1">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
} 