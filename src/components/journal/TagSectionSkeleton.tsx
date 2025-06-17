import { Skeleton } from "@/components/ui/skeleton";

export function TagSectionSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
    </div>
  );
} 