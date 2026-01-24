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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <h2 id="keyboard-help-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
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
                <kbd className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono font-semibold text-gray-700 dark:text-gray-200">
                  {key}
                </kbd>
                <span className="text-gray-600 dark:text-gray-300">{description}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}

export default KeyboardHelpModal;
