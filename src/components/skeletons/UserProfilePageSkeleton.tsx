import { Skeleton } from "@/components/ui/skeleton";

export function UserProfilePageSkeleton() {
  const CardSkeleton = ({ className }: { className?: string }) => (
    <div
      className={`bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 ${className}`}
    >
      <div className="flex items-center mb-4">
        <Skeleton className="h-12 w-12 rounded-full mr-4" />
        <div className="space-y-2 flex-grow">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E4EFE7] to-white dark:from-gray-800 dark:via-gray-900 dark:to-black text-[#2F2569] dark:text-gray-200">
      <div className="overflow-hidden">
        {/* Profile Header Skeleton */}
        <div className="relative">
          <Skeleton className="h-48 md:h-64 w-full" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white dark:border-gray-800" />
          </div>
        </div>
        <div className="pt-16 md:pt-20 pb-4">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
        <div className="flex justify-center border-b border-gray-200 dark:border-gray-700">
          <Skeleton className="h-10 w-24 m-2" />
          <Skeleton className="h-10 w-24 m-2" />
        </div>

        {/* Main Content Skeleton */}
        <div className="py-4 md:py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ProfileCard Skeleton */}
                <CardSkeleton />
                {/* StreakCard Skeleton */}
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-16 w-16 rounded-full mb-4" />
                  <div className="flex space-x-2">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-8 rounded-md" />
                    ))}
                  </div>
                </div>
              </div>

              {/* MoodChart Skeleton */}
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-64 w-full" />
              </div>

              {/* LatestDiaryCard Skeleton */}
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="flex gap-4">
                  <Skeleton className="h-32 w-32 rounded-lg flex-shrink-0" />
                  <div className="flex-grow space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              {/* ActivityCard Skeleton */}
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <Skeleton className="h-6 w-32 mb-6" />
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-grow space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 