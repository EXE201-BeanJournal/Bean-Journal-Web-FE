import { Skeleton } from "@/components/ui/skeleton";
import { AssociatedDiaryCardSkeleton } from "./AssociatedDiaryCardSkeleton";

export function ProjectPageSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-6 flex flex-col gap-6 bg-gray-50 dark:bg-gray-900 h-[calc(100vh-100px)]">
      {/* Project Header Skeleton */}
      <div className="overflow-hidden shadow-lg bg-white dark:bg-gray-800 rounded-lg">
        <Skeleton className="h-10 w-full" />
        <div className="p-4 md:p-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="px-4 md:px-6 pb-4">
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>

      {/* Associated Diaries Skeleton */}
      <section className="flex-grow min-h-0 overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Associated Diaries
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <AssociatedDiaryCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
} 