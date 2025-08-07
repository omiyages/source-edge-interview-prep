// ABOUTME: React Query client configuration with optimized caching and refetch strategies
// ABOUTME: Provides real-time data updates with minimal latency for better user experience

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 2 minutes
      staleTime: 2 * 60 * 1000,
      // Keep data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests
      retry: 1,
      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: 'always',
      // Enable background refetching
      refetchOnMount: 'always',
      // Refetch on reconnect
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});
