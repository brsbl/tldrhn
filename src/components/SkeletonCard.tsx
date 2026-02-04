/**
 * SkeletonCard - Loading placeholder for StoryCard
 * Shows pulsing placeholders matching the new StoryCard layout
 */
export function SkeletonCard() {
  return (
    <article className="flex flex-col bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 shadow-sm overflow-hidden">
      {/* Image area with floating badge skeleton */}
      <div className="relative h-48 bg-slate-100 dark:bg-neutral-700 animate-pulse">
        {/* Floating points badge skeleton */}
        <div className="absolute top-3 right-3 w-16 h-7 bg-slate-200 dark:bg-neutral-600 rounded-full border border-slate-200 dark:border-neutral-500" />
      </div>

      {/* Card content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title placeholder - two lines */}
        <div className="mb-2">
          <div className="h-5 bg-slate-200 dark:bg-neutral-700 rounded animate-pulse mb-2" />
          <div className="h-5 bg-slate-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
        </div>

        {/* Excerpt placeholder - three lines */}
        <div className="mb-4">
          <div className="h-4 bg-slate-200 dark:bg-neutral-700 rounded animate-pulse mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-neutral-700 rounded animate-pulse mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-neutral-700 rounded animate-pulse w-5/6" />
        </div>

        {/* Metadata section with border separator - pushed to bottom */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100 dark:border-neutral-700">
          <div className="flex items-center gap-4">
            {/* Comments placeholder */}
            <div className="h-4 w-12 bg-slate-200 dark:bg-neutral-700 rounded animate-pulse" />
            {/* Time placeholder */}
            <div className="h-4 w-20 bg-slate-200 dark:bg-neutral-700 rounded animate-pulse" />
          </div>
          {/* Author placeholder */}
          <div className="h-4 w-16 bg-slate-200 dark:bg-neutral-700 rounded animate-pulse" />
        </div>
      </div>
    </article>
  );
}

export default SkeletonCard;
