interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex justify-center items-center py-20 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center border-l-4 border-red-500">
        {/* Error Icon */}
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
