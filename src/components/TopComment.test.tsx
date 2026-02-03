import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopComment } from './TopComment';
import type { Comment } from '../types';

// Helper to create a mock comment
const createMockComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 98765,
  by: 'commentuser',
  text: '<p>This is a test comment with some content.</p>',
  score: 25,
  ...overrides,
});

describe('TopComment', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const comment = createMockComment();
      render(<TopComment comment={comment} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders in collapsed state by default', () => {
      const comment = createMockComment({ by: 'testauthor' });
      render(<TopComment comment={comment} />);
      expect(screen.getByText(/Top comment by/)).toBeInTheDocument();
      expect(screen.getByText('testauthor')).toBeInTheDocument();
      expect(screen.getByText('Click to expand')).toBeInTheDocument();
    });

    it('displays author name in collapsed state', () => {
      const comment = createMockComment({ by: 'johndoe' });
      render(<TopComment comment={comment} />);
      expect(screen.getByText('johndoe')).toBeInTheDocument();
    });

    it('does not show comment content when collapsed', () => {
      const comment = createMockComment({
        text: '<p>Hidden content that should not be visible</p>',
      });
      render(<TopComment comment={comment} />);
      expect(
        screen.queryByText('Hidden content that should not be visible')
      ).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('expands when clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        text: '<p>This content becomes visible</p>',
      });
      render(<TopComment comment={comment} />);

      // Click to expand
      await user.click(screen.getByRole('button'));

      // Content should now be visible
      expect(screen.getByText('This content becomes visible')).toBeInTheDocument();
    });

    it('collapses when Collapse button is clicked', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        text: '<p>Content that will be hidden again</p>',
      });
      render(<TopComment comment={comment} />);

      // Expand first
      await user.click(screen.getByRole('button'));
      expect(screen.getByText('Content that will be hidden again')).toBeInTheDocument();

      // Click Collapse button
      await user.click(screen.getByRole('button', { name: /Collapse/i }));

      // Content should be hidden again
      expect(
        screen.queryByText('Content that will be hidden again')
      ).not.toBeInTheDocument();
    });

    it('toggles between states on multiple clicks', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({ text: '<p>Toggle me</p>' });
      render(<TopComment comment={comment} />);

      // Initially collapsed
      expect(screen.queryByText('Toggle me')).not.toBeInTheDocument();

      // Click to expand
      await user.click(screen.getByRole('button'));
      expect(screen.getByText('Toggle me')).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByRole('button', { name: /Collapse/i }));
      expect(screen.queryByText('Toggle me')).not.toBeInTheDocument();

      // Click to expand again
      await user.click(screen.getByRole('button'));
      expect(screen.getByText('Toggle me')).toBeInTheDocument();
    });

    it('works with fireEvent for synchronous testing', () => {
      const comment = createMockComment({ text: '<p>Sync test content</p>' });
      render(<TopComment comment={comment} />);

      // Click to expand
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('Sync test content')).toBeInTheDocument();
    });
  });

  describe('Expanded State', () => {
    it('shows author name in expanded state', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({ by: 'expandedauthor' });
      render(<TopComment comment={comment} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('expandedauthor')).toBeInTheDocument();
      expect(screen.getByText(/Comment by/)).toBeInTheDocument();
    });

    it('shows Collapse button when expanded', async () => {
      const user = userEvent.setup();
      const comment = createMockComment();
      render(<TopComment comment={comment} />);

      await user.click(screen.getByRole('button'));

      expect(
        screen.getByRole('button', { name: /Collapse comment/i })
      ).toBeInTheDocument();
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });

    it('renders HTML content in expanded state', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        text: '<p>Paragraph with <strong>bold</strong> and <em>italic</em></p>',
      });
      render(<TopComment comment={comment} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-expanded attribute set to false when collapsed', () => {
      const comment = createMockComment();
      render(<TopComment comment={comment} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('has aria-expanded attribute set to true when expanded', async () => {
      const user = userEvent.setup();
      const comment = createMockComment();
      render(<TopComment comment={comment} />);

      await user.click(screen.getByRole('button'));

      const collapseButton = screen.getByRole('button', { name: /Collapse/i });
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-controls pointing to content', () => {
      const comment = createMockComment({ id: 12345 });
      render(<TopComment comment={comment} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-controls');
      expect(button.getAttribute('aria-controls')).toMatch(/-content$/);
    });

    it('has aria-label for expand action', () => {
      const comment = createMockComment();
      render(<TopComment comment={comment} />);

      expect(
        screen.getByRole('button', { name: /Expand comment/i })
      ).toBeInTheDocument();
    });

    it('has aria-label for collapse action', async () => {
      const user = userEvent.setup();
      const comment = createMockComment();
      render(<TopComment comment={comment} />);

      await user.click(screen.getByRole('button'));

      expect(
        screen.getByRole('button', { name: /Collapse comment/i })
      ).toBeInTheDocument();
    });

    it('content has matching id for aria-controls', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({ id: 99999 });
      render(<TopComment comment={comment} />);

      const button = screen.getByRole('button');
      const ariaControls = button.getAttribute('aria-controls');

      await user.click(button);

      const content = document.getElementById(ariaControls!);
      expect(content).toBeInTheDocument();
    });

    it('button in collapsed state is full width for easy clicking', () => {
      const comment = createMockComment();
      render(<TopComment comment={comment} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Styling', () => {
    it('has left border indicator', () => {
      const comment = createMockComment();
      const { container } = render(<TopComment comment={comment} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('border-l-4', 'border-orange-400');
    });

    it('has background styling', () => {
      const comment = createMockComment();
      const { container } = render(<TopComment comment={comment} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('bg-slate-50');
    });

    it('has dark mode classes', () => {
      const comment = createMockComment();
      const { container } = render(<TopComment comment={comment} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('dark:bg-neutral-700');
    });

    it('has rounded corner on right side', () => {
      const comment = createMockComment();
      const { container } = render(<TopComment comment={comment} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('rounded-r-md');
    });

    it('has margin-top for spacing', () => {
      const comment = createMockComment();
      const { container } = render(<TopComment comment={comment} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('mt-3');
    });

    it('collapsed button has hover transition', () => {
      const comment = createMockComment();
      render(<TopComment comment={comment} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors');
    });

    it('author name has orange styling', () => {
      const comment = createMockComment({ by: 'styledauthor' });
      render(<TopComment comment={comment} />);

      const authorSpan = screen.getByText('styledauthor');
      expect(authorSpan).toHaveClass('text-orange-600');
    });
  });

  describe('Content Sanitization', () => {
    // Note: DOMPurify is mocked in test setup, so these tests verify
    // the content rendering rather than actual sanitization

    it('renders text content from HTML', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        text: '<p>Simple text content</p>',
      });
      render(<TopComment comment={comment} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('renders content with links', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        text: '<p>Check out <a href="https://example.com">this link</a></p>',
      });
      render(<TopComment comment={comment} />);

      await user.click(screen.getByRole('button'));

      const link = screen.getByRole('link', { name: 'this link' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('renders code elements', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({
        text: '<p>Use <code>console.log()</code> for debugging</p>',
      });
      render(<TopComment comment={comment} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText('console.log()')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty comment text', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({ text: '' });
      render(<TopComment comment={comment} />);

      await user.click(screen.getByRole('button'));

      // Should still render the expanded state structure
      expect(screen.getByText(/Comment by/)).toBeInTheDocument();
    });

    it('handles comment with only whitespace', async () => {
      const user = userEvent.setup();
      const comment = createMockComment({ text: '   ' });
      render(<TopComment comment={comment} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByText(/Comment by/)).toBeInTheDocument();
    });

    it('handles special characters in author name', () => {
      const comment = createMockComment({ by: 'user_with-special.chars' });
      render(<TopComment comment={comment} />);

      expect(screen.getByText('user_with-special.chars')).toBeInTheDocument();
    });

    it('handles numeric comment id', () => {
      const comment = createMockComment({ id: 123456789 });
      render(<TopComment comment={comment} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-controls');
      expect(button.getAttribute('aria-controls')).toMatch(/-content$/);
    });
  });
});
