import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DarkModeToggle } from './DarkModeToggle';

describe('DarkModeToggle', () => {
  // ===================
  // Rendering Tests
  // ===================
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<DarkModeToggle theme="system" onToggle={() => {}} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders Monitor icon when in system mode', () => {
      render(<DarkModeToggle theme="system" onToggle={() => {}} />);
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Sun icon when in light mode', () => {
      render(<DarkModeToggle theme="light" onToggle={() => {}} />);
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders Moon icon when in dark mode', () => {
      render(<DarkModeToggle theme="dark" onToggle={() => {}} />);
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  // ===================
  // Props Tests
  // ===================
  describe('props', () => {
    it('shows correct aria-label for system theme', () => {
      render(<DarkModeToggle theme="system" onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'System theme (click for light mode)'
      );
    });

    it('shows correct aria-label for light mode', () => {
      render(<DarkModeToggle theme="light" onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Light mode (click for dark mode)'
      );
    });

    it('shows correct aria-label for dark mode', () => {
      render(<DarkModeToggle theme="dark" onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Dark mode (click for system theme)'
      );
    });
  });

  // ===================
  // User Interaction Tests
  // ===================
  describe('user interactions', () => {
    it('calls onToggle when clicked', async () => {
      const user = userEvent.setup();
      const handleToggle = vi.fn();

      render(<DarkModeToggle theme="system" onToggle={handleToggle} />);

      await user.click(screen.getByRole('button'));

      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle multiple times on multiple clicks', async () => {
      const user = userEvent.setup();
      const handleToggle = vi.fn();

      render(<DarkModeToggle theme="system" onToggle={handleToggle} />);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleToggle).toHaveBeenCalledTimes(3);
    });
  });

  // ===================
  // Accessibility Tests
  // ===================
  describe('accessibility', () => {
    it('has accessible button role', () => {
      render(<DarkModeToggle theme="system" onToggle={() => {}} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has aria-label attribute', () => {
      render(<DarkModeToggle theme="system" onToggle={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label');
    });

    it('is keyboard accessible (can be focused)', () => {
      render(<DarkModeToggle theme="system" onToggle={() => {}} />);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('can be activated with Enter key', async () => {
      const user = userEvent.setup();
      const handleToggle = vi.fn();

      render(<DarkModeToggle theme="system" onToggle={handleToggle} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('can be activated with Space key', async () => {
      const user = userEvent.setup();
      const handleToggle = vi.fn();

      render(<DarkModeToggle theme="system" onToggle={handleToggle} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });

  // ===================
  // Styling Tests
  // ===================
  describe('styling', () => {
    it('has base button styling classes', () => {
      render(<DarkModeToggle theme="system" onToggle={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-2', 'rounded-lg', 'transition-colors');
    });

    it('has hover styling classes', () => {
      render(<DarkModeToggle theme="system" onToggle={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-slate-100', 'dark:hover:bg-neutral-700');
    });
  });
});
