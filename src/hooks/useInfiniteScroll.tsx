import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  hasNextPage?: boolean;
  isLoading?: boolean;
}

export const useInfiniteScroll = ({
  threshold = 100,
  hasNextPage = true,
  isLoading = false,
}: UseInfiniteScrollOptions = {}) => {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isLoading || isFetching) return;
    setIsFetching(true);
  }, [hasNextPage, isLoading, isFetching]);

  const setTarget = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node && hasNextPage && !isLoading) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            loadMore();
          }
        },
        {
          threshold: 0.1,
          rootMargin: `${threshold}px`,
        }
      );
      observerRef.current.observe(node);
    }

    elementRef.current = node;
  }, [hasNextPage, isLoading, loadMore, threshold]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const resetFetching = useCallback(() => {
    setIsFetching(false);
  }, []);

  return {
    isFetching,
    setTarget,
    resetFetching,
  };
};

export default useInfiniteScroll;