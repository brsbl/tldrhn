import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkeletonCard } from './SkeletonCard';

describe('SkeletonCard', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SkeletonCard />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('renders as an article element', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      expect(article.tagName).toBe('ARTICLE');
    });
  });

  describe('Structure', () => {
    it('contains image area placeholder', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      // Check for the image area div with h-48 class
      const imageArea = article.querySelector('.h-48');
      expect(imageArea).toBeInTheDocument();
    });

    it('contains floating badge skeleton', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      // Badge is positioned absolutely with rounded-full
      const badge = article.querySelector('.absolute.rounded-full');
      expect(badge).toBeInTheDocument();
    });

    it('contains title placeholder lines', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      // Title section has h-5 elements
      const titleLines = article.querySelectorAll('.h-5');
      expect(titleLines.length).toBeGreaterThanOrEqual(2);
    });

    it('contains excerpt placeholder lines', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      // Summary section has h-4 elements
      const excerptLines = article.querySelectorAll('.h-4');
      expect(excerptLines.length).toBeGreaterThanOrEqual(3);
    });

    it('contains metadata section with separator', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      // Metadata section has border-t
      const metadataSection = article.querySelector('.border-t');
      expect(metadataSection).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('has animate-pulse class on image area', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      const imageArea = article.querySelector('.h-48');
      expect(imageArea).toHaveClass('animate-pulse');
    });

    it('has animate-pulse class on multiple skeleton elements', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      const pulsingElements = article.querySelectorAll('.animate-pulse');
      // Should have multiple pulsing elements (image, title lines, excerpt lines, etc.)
      expect(pulsingElements.length).toBeGreaterThan(5);
    });
  });

  describe('Styling', () => {
    it('has rounded border styling matching StoryCard', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('rounded-2xl', 'border');
    });

    it('has background color classes', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('bg-white');
    });

    it('has dark mode classes', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('dark:bg-neutral-800');
    });

    it('has shadow styling', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('shadow-sm');
    });

    it('has overflow hidden for rounded corners', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('overflow-hidden');
    });

    it('has proper border styling', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('border-slate-200', 'dark:border-neutral-700');
    });
  });

  describe('Layout Consistency with StoryCard', () => {
    it('has same image area height as StoryCard', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      const imageArea = article.querySelector('.h-48');
      expect(imageArea).toBeInTheDocument();
    });

    it('has content padding matching StoryCard', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      const contentArea = article.querySelector('.p-5');
      expect(contentArea).toBeInTheDocument();
    });

    it('has metadata section with pt-4 padding', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      const metadataSection = article.querySelector('.pt-4');
      expect(metadataSection).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic article element', () => {
      render(<SkeletonCard />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('does not have any focusable interactive elements', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      const interactiveElements = article.querySelectorAll(
        'a, button, input, select, textarea'
      );
      expect(interactiveElements.length).toBe(0);
    });
  });

  describe('Responsive Design', () => {
    it('has width placeholders with fractional widths for variety', () => {
      render(<SkeletonCard />);
      const article = screen.getByRole('article');
      // Check for fractional width classes that create visual variety
      expect(article.querySelector('.w-3\\/4')).toBeInTheDocument();
      expect(article.querySelector('.w-5\\/6')).toBeInTheDocument();
    });
  });
});
