import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardHelpModal } from './KeyboardHelpModal';

describe('KeyboardHelpModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<KeyboardHelpModal {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<KeyboardHelpModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('returns null when closed', () => {
      const { container } = render(<KeyboardHelpModal isOpen={false} onClose={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('displays the modal title', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /keyboard shortcuts/i })).toBeInTheDocument();
    });

    it('renders the close button', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /close help modal/i })).toBeInTheDocument();
    });

    it('displays footer instruction text', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      expect(screen.getByText(/press/i)).toBeInTheDocument();
      expect(screen.getByText(/or click outside to close/i)).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts list', () => {
    const expectedShortcuts = [
      { key: 'J', description: 'Move to next story' },
      { key: 'K', description: 'Move to previous story' },
      { key: 'O', description: 'Open article in new tab' },
      { key: 'C', description: 'Open HN comments in new tab' },
      { key: 'R', description: 'Refresh stories' },
      { key: '?', description: 'Show this help' },
    ];

    it('renders all keyboard shortcuts', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(expectedShortcuts.length);
    });

    it.each(expectedShortcuts)('displays shortcut "$key" with description "$description"', ({ key, description }) => {
      render(<KeyboardHelpModal {...defaultProps} />);
      expect(screen.getByText(key)).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('renders shortcuts with kbd elements', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const kbdElements = document.querySelectorAll('kbd');
      // 6 shortcuts + 1 Esc in footer
      expect(kbdElements.length).toBeGreaterThanOrEqual(expectedShortcuts.length);
    });

    it('displays shortcuts in a list', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<KeyboardHelpModal isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close help modal/i });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking the backdrop', () => {
      const onClose = vi.fn();
      render(<KeyboardHelpModal isOpen={true} onClose={onClose} />);

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside the modal content', () => {
      const onClose = vi.fn();
      render(<KeyboardHelpModal isOpen={true} onClose={onClose} />);

      const modalContent = screen.getByText('Keyboard Shortcuts');
      fireEvent.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('stops event propagation when clicking modal content area', () => {
      const onClose = vi.fn();
      render(<KeyboardHelpModal isOpen={true} onClose={onClose} />);

      // Click on the list area inside modal
      const list = screen.getByRole('list');
      fireEvent.click(list);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to the title', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'keyboard-help-title');
    });

    it('title has matching id for aria-labelledby', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const title = screen.getByRole('heading', { name: /keyboard shortcuts/i });
      expect(title).toHaveAttribute('id', 'keyboard-help-title');
    });

    it('close button has aria-label', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: /close help modal/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close help modal');
    });

    it('close button is focusable', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: /close help modal/i });
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });
  });

  describe('styling', () => {
    it('has fixed positioning for overlay', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('fixed', 'inset-0');
    });

    it('has semi-transparent backdrop', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('bg-black', 'bg-opacity-50');
    });

    it('has high z-index for modal overlay', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('z-50');
    });

    it('modal is centered', () => {
      render(<KeyboardHelpModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });
});
