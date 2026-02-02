/**
 * SkeletonCard - Loading placeholder for StoryCard
 * Shows pulsing gray rectangles matching StoryCard layout
 */
export function SkeletonCard() {
  return (
    <article className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
      {/* Screenshot placeholder - 16:9 aspect ratio */}
      <div className="aspect-video bg-gray-200 dark:bg-neutral-700 animate-pulse" />

      {/* Card content */}
      <div className="p-4">
        {/* Title placeholder - two lines */}
        <div className="mb-2">
          <div className="h-5 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse mb-2" />
          <div className="h-5 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
        </div>

        {/* Summary placeholder - two lines */}
        <div className="mb-3">
          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-5/6" />
        </div>

        {/* Metadata row placeholder */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Points placeholder */}
            <div className="h-4 w-12 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
            {/* Comments placeholder */}
            <div className="h-4 w-10 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
          </div>
          {/* Time placeholder */}
          <div className="h-4 w-16 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
        </div>

        {/* HN Discussion link placeholder */}
        <div className="mt-3 h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
      </div>
    </article>
  );
}

export default SkeletonCard;
