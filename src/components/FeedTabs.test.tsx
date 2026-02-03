import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedTabs } from './FeedTabs';
import { FEED_TYPES, FEED_LABELS } from '../types/index';
import type { FeedType } from '../types/index';

// Mock getBoundingClientRect for underline positioning tests
const mockGetBoundingClientRect = vi.fn();

beforeEach(() => {
  // Reset mocks before each test
  mockGetBoundingClientRect.mockReset();

  // Default mock implementation
  mockGetBoundingClientRect.mockReturnValue({
    left: 0,
    width: 100,
    top: 0,
    right: 100,
    bottom: 40,
    height: 40,
    x: 0,
    y: 0,
    toJSON: () => {},
  });

  // Override getBoundingClientRect on HTMLElement prototype
  Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
});

describe('FeedTabs', () => {
  // ===================
  // Rendering Tests
  // ===================
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders all feed type buttons', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);

      FEED_TYPES.forEach((feedType) => {
        expect(screen.getByRole('button', { name: FEED_LABELS[feedType] })).toBeInTheDocument();
      });
    });

    it('renders correct labels for each feed type', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);

      expect(screen.getByRole('button', { name: 'Top' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Show HN' })).toBeInTheDocument();
    });

    it('active tab has border-bottom indicator', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      const activeTab = screen.getByRole('button', { name: 'Top' });
      expect(activeTab).toHaveClass('border-b-2', 'border-orange-600');
    });
  });

  // ===================
  // Props Tests
  // ===================
  describe('props', () => {
    it('marks "top" tab as active when activeFeed is "top"', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      const topButton = screen.getByRole('button', { name: 'Top' });
      expect(topButton).toHaveAttribute('aria-current', 'page');
    });

    it('marks "new" tab as active when activeFeed is "new"', () => {
      render(<FeedTabs activeFeed="new" onFeedChange={() => {}} />);
      const newButton = screen.getByRole('button', { name: 'New' });
      expect(newButton).toHaveAttribute('aria-current', 'page');
    });

    it('marks "show" tab as active when activeFeed is "show"', () => {
      render(<FeedTabs activeFeed="show" onFeedChange={() => {}} />);
      const showButton = screen.getByRole('button', { name: 'Show HN' });
      expect(showButton).toHaveAttribute('aria-current', 'page');
    });

    it('only one tab is marked as current at a time', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);

      const buttons = screen.getAllByRole('button');
      const activeButtons = buttons.filter(
        (btn) => btn.getAttribute('aria-current') === 'page'
      );

      expect(activeButtons).toHaveLength(1);
    });

    it('inactive tabs do not have aria-current attribute', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);

      const newButton = screen.getByRole('button', { name: 'New' });
      const showButton = screen.getByRole('button', { name: 'Show HN' });

      expect(newButton).not.toHaveAttribute('aria-current');
      expect(showButton).not.toHaveAttribute('aria-current');
    });
  });

  // ===================
  // User Interaction Tests
  // ===================
  describe('user interactions', () => {
    it('calls onFeedChange with "top" when Top tab is clicked', async () => {
      const user = userEvent.setup();
      const handleFeedChange = vi.fn();

      render(<FeedTabs activeFeed="new" onFeedChange={handleFeedChange} />);

      await user.click(screen.getByRole('button', { name: 'Top' }));

      expect(handleFeedChange).toHaveBeenCalledWith('top');
    });

    it('calls onFeedChange with "new" when New tab is clicked', async () => {
      const user = userEvent.setup();
      const handleFeedChange = vi.fn();

      render(<FeedTabs activeFeed="top" onFeedChange={handleFeedChange} />);

      await user.click(screen.getByRole('button', { name: 'New' }));

      expect(handleFeedChange).toHaveBeenCalledWith('new');
    });

    it('calls onFeedChange with "show" when Show HN tab is clicked', async () => {
      const user = userEvent.setup();
      const handleFeedChange = vi.fn();

      render(<FeedTabs activeFeed="top" onFeedChange={handleFeedChange} />);

      await user.click(screen.getByRole('button', { name: 'Show HN' }));

      expect(handleFeedChange).toHaveBeenCalledWith('show');
    });

    it('calls onFeedChange even when clicking the already active tab', async () => {
      const user = userEvent.setup();
      const handleFeedChange = vi.fn();

      render(<FeedTabs activeFeed="top" onFeedChange={handleFeedChange} />);

      await user.click(screen.getByRole('button', { name: 'Top' }));

      expect(handleFeedChange).toHaveBeenCalledWith('top');
    });

    it('calls onFeedChange with correct value for each feed type', async () => {
      const user = userEvent.setup();
      const handleFeedChange = vi.fn();

      render(<FeedTabs activeFeed="top" onFeedChange={handleFeedChange} />);

      for (const feedType of FEED_TYPES) {
        await user.click(screen.getByRole('button', { name: FEED_LABELS[feedType] }));
        expect(handleFeedChange).toHaveBeenCalledWith(feedType);
      }

      expect(handleFeedChange).toHaveBeenCalledTimes(FEED_TYPES.length);
    });
  });

  // ===================
  // Accessibility Tests
  // ===================
  describe('accessibility', () => {
    it('has navigation role', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has aria-label for navigation', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Feeds');
    });

    it('active tab has aria-current="page"', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      const activeTab = screen.getByRole('button', { name: 'Top' });
      expect(activeTab).toHaveAttribute('aria-current', 'page');
    });

    it('all tabs are keyboard focusable', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        button.focus();
        expect(button).toHaveFocus();
      });
    });

    it('tabs can be activated with Enter key', async () => {
      const user = userEvent.setup();
      const handleFeedChange = vi.fn();

      render(<FeedTabs activeFeed="top" onFeedChange={handleFeedChange} />);

      const newButton = screen.getByRole('button', { name: 'New' });
      newButton.focus();
      await user.keyboard('{Enter}');

      expect(handleFeedChange).toHaveBeenCalledWith('new');
    });

    it('tabs can be activated with Space key', async () => {
      const user = userEvent.setup();
      const handleFeedChange = vi.fn();

      render(<FeedTabs activeFeed="top" onFeedChange={handleFeedChange} />);

      const newButton = screen.getByRole('button', { name: 'New' });
      newButton.focus();
      await user.keyboard(' ');

      expect(handleFeedChange).toHaveBeenCalledWith('new');
    });

    it('each tab has data-feed attribute for identification', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);

      FEED_TYPES.forEach((feedType) => {
        const button = screen.getByRole('button', { name: FEED_LABELS[feedType] });
        expect(button).toHaveAttribute('data-feed', feedType);
      });
    });
  });

  // ===================
  // Styling Tests
  // ===================
  describe('styling', () => {
    it('active tab has orange text color classes', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      const activeTab = screen.getByRole('button', { name: 'Top' });
      expect(activeTab).toHaveClass('text-orange-600', 'dark:text-orange-400');
    });

    it('inactive tabs have slate text color classes', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      const inactiveTab = screen.getByRole('button', { name: 'New' });
      expect(inactiveTab).toHaveClass('text-slate-600', 'dark:text-neutral-400');
    });

    it('inactive tabs have hover styling classes', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      const inactiveTab = screen.getByRole('button', { name: 'New' });
      expect(inactiveTab).toHaveClass('hover:text-slate-900', 'dark:hover:text-neutral-200');
    });

    it('tabs have transition-colors for smooth color changes', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      const tab = screen.getByRole('button', { name: 'Top' });
      expect(tab).toHaveClass('transition-colors');
    });

    it('tabs have proper font styling', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      const tab = screen.getByRole('button', { name: 'Top' });
      expect(tab).toHaveClass('font-medium', 'text-sm');
    });

    it('tabs have whitespace-nowrap to prevent text wrapping', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      const tab = screen.getByRole('button', { name: 'Top' });
      expect(tab).toHaveClass('whitespace-nowrap');
    });

    it('nav has flexbox layout', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      expect(screen.getByRole('navigation')).toHaveClass('flex', 'gap-6');
    });

    it('nav has overflow handling for small screens', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      expect(screen.getByRole('navigation')).toHaveClass('overflow-x-auto');
    });

    it('inactive tabs have transparent border', () => {
      render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);
      const inactiveTab = screen.getByRole('button', { name: 'New' });
      expect(inactiveTab).toHaveClass('border-transparent');
    });
  });

  // ===================
  // State Management Tests
  // ===================
  describe('state management', () => {
    it('updates active state when activeFeed prop changes', () => {
      const { rerender } = render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);

      expect(screen.getByRole('button', { name: 'Top' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('button', { name: 'New' })).not.toHaveAttribute('aria-current');

      rerender(<FeedTabs activeFeed="new" onFeedChange={() => {}} />);

      expect(screen.getByRole('button', { name: 'Top' })).not.toHaveAttribute('aria-current');
      expect(screen.getByRole('button', { name: 'New' })).toHaveAttribute('aria-current', 'page');
    });

    it('re-renders correctly when switching between all feed types', () => {
      const feedTypes: FeedType[] = ['top', 'new', 'show'];
      const { rerender } = render(<FeedTabs activeFeed="top" onFeedChange={() => {}} />);

      feedTypes.forEach((feedType) => {
        rerender(<FeedTabs activeFeed={feedType} onFeedChange={() => {}} />);

        const activeButton = screen.getByRole('button', { name: FEED_LABELS[feedType] });
        expect(activeButton).toHaveAttribute('aria-current', 'page');

        // Verify others are not active
        feedTypes
          .filter((ft) => ft !== feedType)
          .forEach((inactiveFeed) => {
            const inactiveButton = screen.getByRole('button', { name: FEED_LABELS[inactiveFeed] });
            expect(inactiveButton).not.toHaveAttribute('aria-current');
          });
      });
    });
  });
});
