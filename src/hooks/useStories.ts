import { useState, useEffect, useCallback } from 'react';
import type { Story, FeedType } from '../types/index';

/**
 * Custom hook for fetching stories from the API
 * Manages loading, error, and data states with a refetch capability
 */
export function useStories(feed: FeedType = 'top') {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stories/${feed}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch stories: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response is an array
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array of stories');
      }

      setStories(data as Story[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setStories(null);
    } finally {
      setLoading(false);
    }
  }, [feed]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const refetch = useCallback(() => {
    fetchStories();
  }, [fetchStories]);

  return { stories, loading, error, refetch };
}
