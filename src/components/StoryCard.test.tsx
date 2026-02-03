import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoryCard } from './StoryCard';
import type { Story } from '../types';

// Helper to create a mock story
const createMockStory = (overrides: Partial<Story> = {}): Story => ({
  id: 12345,
  title: 'Test Story Title',
  url: 'https://example.com/article',
  hnUrl: 'https://news.ycombinator.com/item?id=12345',
  score: 150,
  by: 'testuser',
  time: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  descendants: 42,
  excerpt: 'This is a test excerpt with some text.',
  screenshotUrl: '/screenshots/12345.png',
  topComment: null,
  fetchedAt: Date.now(),
  articleText: 'Full article text here',
  ...overrides,
});

describe('StoryCard', () => {
  let originalDateNow: () => number;

  beforeEach(() => {
    // Mock Date.now for consistent time formatting
    originalDateNow = Date.now;
    Date.now = vi.fn(() => 1700000000000); // Fixed timestamp
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const story = createMockStory();
      render(<StoryCard story={story} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('renders the story title', () => {
      const story = createMockStory({ title: 'My Amazing Story' });
      render(<StoryCard story={story} />);
      expect(screen.getByText('My Amazing Story')).toBeInTheDocument();
    });

    it('renders the score', () => {
      const story = createMockStory({ score: 250 });
      render(<StoryCard story={story} />);
      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('renders the comment count', () => {
      const story = createMockStory({ descendants: 99 });
      render(<StoryCard story={story} />);
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('renders the author name', () => {
      const story = createMockStory({ by: 'johndoe' });
      render(<StoryCard story={story} />);
      expect(screen.getByText('johndoe')).toBeInTheDocument();
    });

    it('renders the excerpt when provided', () => {
      const story = createMockStory({ excerpt: 'A brief excerpt' });
      render(<StoryCard story={story} />);
      expect(screen.getByText('A brief excerpt')).toBeInTheDocument();
    });

    it('does not render excerpt section when excerpt is empty', () => {
      const story = createMockStory({ excerpt: '' });
      render(<StoryCard story={story} />);
      // Summary should not be present in the document
      const article = screen.getByRole('article');
      // The excerpt div would have specific classes if present
      const excerptDiv = article.querySelector('.line-clamp-3');
      expect(excerptDiv).toBeNull();
    });

    it('renders screenshot image when screenshotUrl is provided', () => {
      const story = createMockStory({
        title: 'Story With Screenshot',
        screenshotUrl: '/screenshots/test.png',
      });
      render(<StoryCard story={story} />);
      const img = screen.getByAltText('Screenshot of Story With Screenshot');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/screenshots/test.png');
    });

    it('renders placeholder when no screenshot is provided', () => {
      const story = createMockStory({ screenshotUrl: '' });
      render(<StoryCard story={story} />);
      expect(
        screen.queryByRole('img', { name: /screenshot/i })
      ).not.toBeInTheDocument();
      // Check for SVG placeholder
      const article = screen.getByRole('article');
      expect(article.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('renders correctly when isSelected is true', () => {
      const story = createMockStory();
      render(<StoryCard story={story} isSelected={true} />);
      const article = screen.getByRole('article');
      // Selection state is tracked but no visual ring is applied
      expect(article).toBeInTheDocument();
    });

    it('does not apply selected state styling when isSelected is false', () => {
      const story = createMockStory();
      render(<StoryCard story={story} isSelected={false} />);
      const article = screen.getByRole('article');
      expect(article).not.toHaveClass('ring-2');
    });

    it('sets data-story-index attribute when index is provided', () => {
      const story = createMockStory();
      render(<StoryCard story={story} index={5} />);
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('data-story-index', '5');
    });

    it('sets aria-setsize and aria-posinset attributes', () => {
      const story = createMockStory();
      render(
        <StoryCard story={story} aria-setsize={20} aria-posinset={3} />
      );
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-setsize', '20');
      expect(article).toHaveAttribute('aria-posinset', '3');
    });
  });

  describe('Links', () => {
    it('renders title link with correct href', () => {
      const story = createMockStory({ url: 'https://example.com/test' });
      render(<StoryCard story={story} />);
      const titleLink = screen.getByRole('link', {
        name: story.title,
      });
      expect(titleLink).toHaveAttribute('href', 'https://example.com/test');
      expect(titleLink).toHaveAttribute('target', '_blank');
      expect(titleLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('uses hnUrl when url is empty', () => {
      const story = createMockStory({
        url: '',
        hnUrl: 'https://news.ycombinator.com/item?id=99999',
      });
      render(<StoryCard story={story} />);
      const titleLink = screen.getByRole('link', {
        name: story.title,
      });
      expect(titleLink).toHaveAttribute(
        'href',
        'https://news.ycombinator.com/item?id=99999'
      );
    });

    it('renders comments link with correct href', () => {
      const story = createMockStory({
        hnUrl: 'https://news.ycombinator.com/item?id=12345',
        descendants: 42,
      });
      render(<StoryCard story={story} />);
      const commentsLink = screen.getByRole('link', {
        name: /42 comments on Hacker News/i,
      });
      expect(commentsLink).toHaveAttribute(
        'href',
        'https://news.ycombinator.com/item?id=12345'
      );
    });
  });

  describe('Image Error Handling', () => {
    it('shows placeholder when image fails to load', () => {
      const story = createMockStory({ screenshotUrl: '/invalid.png' });
      render(<StoryCard story={story} />);

      const img = screen.getByAltText(/Screenshot of/);
      fireEvent.error(img);

      // After error, image should be replaced with placeholder
      expect(
        screen.queryByAltText(/Screenshot of/)
      ).not.toBeInTheDocument();
      // SVG placeholder should now be visible
      const article = screen.getByRole('article');
      expect(article.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('renders time element with proper datetime attribute', () => {
      const timestamp = 1699996400; // Fixed timestamp
      const story = createMockStory({ time: timestamp });
      render(<StoryCard story={story} />);

      const timeElement = screen.getByRole('article').querySelector('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveAttribute('dateTime');
      expect(timeElement?.getAttribute('dateTime')).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure with article element', () => {
      const story = createMockStory();
      render(<StoryCard story={story} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('has heading for the title', () => {
      const story = createMockStory({ title: 'Accessible Title' });
      render(<StoryCard story={story} />);
      expect(
        screen.getByRole('heading', { level: 2, name: /Accessible Title/i })
      ).toBeInTheDocument();
    });

    it('has aria-label on comments link', () => {
      const story = createMockStory({ descendants: 15 });
      render(<StoryCard story={story} />);
      const commentsLink = screen.getByLabelText(/15 comments on Hacker News/i);
      expect(commentsLink).toBeInTheDocument();
    });

    it('image has alt text', () => {
      const story = createMockStory({
        title: 'Test Article',
        screenshotUrl: '/test.png',
      });
      render(<StoryCard story={story} />);
      expect(screen.getByAltText('Screenshot of Test Article')).toBeInTheDocument();
    });

    it('image has lazy loading attribute', () => {
      const story = createMockStory({ screenshotUrl: '/test.png' });
      render(<StoryCard story={story} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Styling and Transitions', () => {
    it('has hover transition classes on the article', () => {
      const story = createMockStory();
      render(<StoryCard story={story} />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('transition-all', 'duration-300');
    });

    it('has group class for group-hover effects', () => {
      const story = createMockStory();
      render(<StoryCard story={story} />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('group');
    });

    it('has rounded border styling', () => {
      const story = createMockStory();
      render(<StoryCard story={story} />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('rounded-2xl', 'border');
    });
  });
});
