import { QueryClient } from "@tanstack/react-query";

// Optimized QueryClient configuration for better performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increase stale time for better performance
      staleTime: 10 * 60 * 1000, // 10 minutes
      // Keep data in cache longer
      gcTime: 30 * 60 * 1000, // 30 minutes
      // Reduce unnecessary refetches
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: 'always',
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Query key factories for better cache management
export const queryKeys = {
  // Questions
  questions: {
    all: ['questions'] as const,
    lists: () => [...queryKeys.questions.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.questions.lists(), filters] as const,
    details: () => [...queryKeys.questions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.questions.details(), id] as const,
  },
  
  // Resources
  resources: {
    all: ['resources'] as const,
    lists: () => [...queryKeys.resources.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.resources.lists(), filters] as const,
  },
  
  // Courses
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.courses.lists(), filters] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
  },
  
  // User progress
  userProgress: {
    all: ['userProgress'] as const,
    byUser: (userId: string) => [...queryKeys.userProgress.all, userId] as const,
    byCourse: (userId: string, courseId: string) => [...queryKeys.userProgress.byUser(userId), courseId] as const,
  },
  
  // Admin
  admin: {
    all: ['admin'] as const,
    pendingQuestions: () => [...queryKeys.admin.all, 'pendingQuestions'] as const,
    allQuestions: () => [...queryKeys.admin.all, 'allQuestions'] as const,
  }
};

// Cache invalidation helpers
export const invalidateQueries = {
  questions: () => queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
  resources: () => queryClient.invalidateQueries({ queryKey: queryKeys.resources.all }),
  courses: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
  userProgress: (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProgress.byUser(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProgress.all });
    }
  },
  admin: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
};

// Prefetch helpers for better UX
export const prefetchQueries = {
  questions: async (filters: Record<string, any> = {}) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.questions.list(filters),
      queryFn: async () => {
        // Import dynamically to avoid circular dependencies
        const { fetchQuestions } = await import('@/services/questionsService');
        return fetchQuestions(false);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
  
  resources: async (filters: Record<string, any> = {}) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.resources.list(filters),
      queryFn: async () => {
        const { fetchResources } = await import('@/services/resourcesService');
        return fetchResources(10);
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  }
};

