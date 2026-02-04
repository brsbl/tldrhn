import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  // ===================
  // Rendering Tests
  // ===================
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders the logo text "Visual HN"', () => {
      render(<Header />);
      expect(screen.getByRole('heading', { name: /visual hn/i })).toBeInTheDocument();
    });

    it('renders children when provided', () => {
      render(
        <Header>
          <nav data-testid="child-nav">Navigation</nav>
        </Header>
      );
      expect(screen.getByTestId('child-nav')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(
        <Header>
          <span data-testid="child-1">Child 1</span>
          <span data-testid="child-2">Child 2</span>
        </Header>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  // ===================
  // Accessibility Tests
  // ===================
  describe('accessibility', () => {
    it('has banner role (header element)', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('has heading element for the logo', () => {
      render(<Header />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Visual HN');
    });
  });

  // ===================
  // Styling Tests
  // ===================
  describe('styling', () => {
    it('header has sticky positioning', () => {
      const { container } = render(<Header />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky', 'top-0');
    });

    it('header has backdrop blur effect', () => {
      const { container } = render(<Header />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('backdrop-blur-sm');
    });

    it('header has z-index for proper stacking', () => {
      const { container } = render(<Header />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('z-10');
    });

    it('header has border styling', () => {
      const { container } = render(<Header />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('border-b', 'border-slate-200');
    });

    it('header has dark mode classes', () => {
      const { container } = render(<Header />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('dark:bg-neutral-800/95', 'dark:border-neutral-700');
    });

    it('header has transition-colors for smooth theme switching', () => {
      const { container } = render(<Header />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('transition-colors');
    });

    it('logo has correct typography classes', () => {
      render(<Header />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('font-mono', 'font-bold', 'text-lg');
    });
  });

  // ===================
  // Layout Tests
  // ===================
  describe('layout', () => {
    it('has max-width container', () => {
      const { container } = render(<Header />);
      const innerDiv = container.querySelector('header > div');
      expect(innerDiv).toHaveClass('max-w-7xl', 'mx-auto');
    });

    it('has responsive padding', () => {
      const { container } = render(<Header />);
      const innerDiv = container.querySelector('header > div');
      expect(innerDiv).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });

    it('uses flexbox for layout', () => {
      const { container } = render(<Header />);
      const innerDiv = container.querySelector('header > div');
      expect(innerDiv).toHaveClass('flex', 'items-center', 'gap-6');
    });
  });
});
