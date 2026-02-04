import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  const defaultProps = {
    message: 'Unable to fetch data from server',
    onRetry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<ErrorState {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays the default heading', () => {
      render(<ErrorState {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    });

    it('displays the error message prop', () => {
      const customMessage = 'Failed to load stories';
      render(<ErrorState {...defaultProps} message={customMessage} />);
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('renders the retry button with correct text', () => {
      render(<ErrorState {...defaultProps} />);
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('renders the error icon', () => {
      render(<ErrorState {...defaultProps} />);
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-red-500');
    });
  });

  describe('props', () => {
    it('applies custom message correctly', () => {
      const messages = [
        'Network error occurred',
        'API rate limit exceeded',
        'Unable to connect to server',
      ];

      messages.forEach((message) => {
        const { unmount } = render(<ErrorState message={message} onRetry={vi.fn()} />);
        expect(screen.getByText(message)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('user interactions', () => {
    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Error" onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry multiple times on multiple clicks', () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Error" onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('accessibility', () => {
    it('retry button is focusable', () => {
      render(<ErrorState {...defaultProps} />);
      const button = screen.getByRole('button', { name: /try again/i });
      button.focus();
      expect(button).toHaveFocus();
    });

    it('retry button has proper focus styles defined', () => {
      render(<ErrorState {...defaultProps} />);
      const button = screen.getByRole('button', { name: /try again/i });
      // Check that focus ring classes are present
      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toContain('focus:ring-red-500');
      expect(button.className).toContain('focus:outline-none');
    });

    it('has semantic heading structure', () => {
      render(<ErrorState {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Something went wrong');
    });
  });

  describe('styling', () => {
    it('has red border accent', () => {
      render(<ErrorState {...defaultProps} />);
      const container = document.querySelector('.border-red-500');
      expect(container).toBeInTheDocument();
    });

    it('has centered layout', () => {
      const { container } = render(<ErrorState {...defaultProps} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex', 'justify-center', 'items-center');
    });
  });
});
