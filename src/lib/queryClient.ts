import { QueryClient } from '@tanstack/react-query';

// Optimized React Query configuration for performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep data in cache for 10 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // Kanban queries
  kanban: {
    all: ['kanban'] as const,
    data: (showRejected: boolean) => ['kanban', 'data', showRejected] as const,
    users: ['kanban', 'users'] as const,
  },
  
  // User queries
  users: {
    all: ['users'] as const,
    list: () => ['users', 'list'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    profile: (id: string) => ['users', 'profile', id] as const,
  },
  
  // Resources queries
  resources: {
    all: ['resources'] as const,
    list: () => ['resources', 'list'] as const,
    detail: (id: string) => ['resources', 'detail', id] as const,
  },
  
  // Course queries
  courses: {
    all: ['courses'] as const,
    list: () => ['courses', 'list'] as const,
    detail: (id: string) => ['courses', 'detail', id] as const,
    assignments: (userId: string) => ['courses', 'assignments', userId] as const,
  },
  
  // Tasks queries
  tasks: {
    all: ['tasks'] as const,
    pending: () => ['tasks', 'pending'] as const,
    user: (userId: string) => ['tasks', 'user', userId] as const,
  },
  
  // Interviews queries
  interviews: {
    all: ['interviews'] as const,
    upcoming: () => ['interviews', 'upcoming'] as const,
    user: (userId: string) => ['interviews', 'user', userId] as const,
  },
} as const;

// Optimistic update helpers
export const optimisticUpdates = {
  // Move user to new stage optimistically
  moveUser: (queryClient: any, userId: string, newStage: string) => {
    queryClient.setQueryData(queryKeys.kanban.data(false), (old: any) => {
      if (!old) return old;
      return old.map((user: any) => 
        user.user_id === userId 
          ? { ...user, stage_name: newStage, last_updated_at: new Date().toISOString() }
          : user
      );
    });
  },
  
  // Add new user optimistically
  addUser: (queryClient: any, newUser: any) => {
    queryClient.setQueryData(queryKeys.kanban.data(false), (old: any) => {
      if (!old) return old;
      return [...old, newUser];
    });
  },
  
  // Remove user optimistically
  removeUser: (queryClient: any, userId: string) => {
    queryClient.setQueryData(queryKeys.kanban.data(false), (old: any) => {
      if (!old) return old;
      return old.filter((user: any) => user.user_id !== userId);
    });
  },
  
  // Update user optimistically
  updateUser: (queryClient: any, userId: string, updates: any) => {
    queryClient.setQueryData(queryKeys.kanban.data(false), (old: any) => {
      if (!old) return old;
      return old.map((user: any) => 
        user.user_id === userId 
          ? { ...user, ...updates, last_updated_at: new Date().toISOString() }
          : user
      );
    });
  },
};

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all Kanban data
  kanban: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.kanban.all });
  },
  
  // Invalidate user-specific data
  user: (queryClient: any, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.user(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.interviews.user(userId) });
  },
  
  // Invalidate all data
  all: (queryClient: any) => {
    queryClient.invalidateQueries();
  },
};