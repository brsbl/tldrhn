interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'J', description: 'Move to next story' },
  { key: 'K', description: 'Move to previous story' },
  { key: 'O', description: 'Open article in new tab' },
  { key: 'C', description: 'Open HN comments in new tab' },
  { key: 'R', description: 'Refresh stories' },
  { key: '?', description: 'Show this help' },
];

/**
 * KeyboardHelpModal displays a list of keyboard shortcuts
 * when the user presses the ? key.
 */
export function KeyboardHelpModal({ isOpen, onClose }: KeyboardHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-help-title"
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 dark:bg-neutral-700 px-6 py-4 border-b border-slate-200 dark:border-neutral-600 flex items-center justify-between">
          <h2 id="keyboard-help-title" className="text-lg font-semibold text-slate-900 dark:text-neutral-100">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors"
            aria-label="Close help modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-6">
          <ul className="space-y-3">
            {shortcuts.map(({ key, description }) => (
              <li key={key} className="flex items-center gap-4">
                <kbd className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 dark:bg-neutral-700 border border-slate-300 dark:border-neutral-600 rounded text-sm font-mono font-semibold text-slate-700 dark:text-neutral-200">
                  {key}
                </kbd>
                <span className="text-slate-600 dark:text-neutral-300">{description}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-neutral-700 px-6 py-3 border-t border-slate-200 dark:border-neutral-600">
          <p className="text-sm text-slate-500 dark:text-neutral-400 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-neutral-600 rounded text-xs font-mono">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}

export default KeyboardHelpModal;
