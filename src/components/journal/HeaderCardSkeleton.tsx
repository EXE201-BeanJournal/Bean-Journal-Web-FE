import { Skeleton } from "@/components/ui/skeleton";

export function HeaderCardSkeleton() {
  return (
    <div className="p-4 md:p-6 rounded-lg bg-gray-100 dark:bg-gray-800/50 mb-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    </div>
  );
} 