import type { Story } from '../types';
import { StoryCard } from './StoryCard';

interface StoryGridProps {
  stories: Story[];
  selectedIndex?: number;
}

/**
 * StoryGrid displays a responsive grid of StoryCard components.
 *
 * Responsive layout:
 * - 1 column on mobile (default)
 * - 2 columns on tablet (md breakpoint, 768px+)
 * - 3 columns on desktop (lg breakpoint, 1024px+)
 */
export function StoryGrid({ stories, selectedIndex = -1 }: StoryGridProps) {
  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      role="feed"
      aria-label="Hacker News stories"
      aria-busy="false"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story, index) => (
          <StoryCard
            key={story.id}
            story={story}
            isSelected={index === selectedIndex}
            index={index}
            aria-setsize={stories.length}
            aria-posinset={index + 1}
          />
        ))}
      </div>
    </section>
  );
}

export default StoryGrid;
