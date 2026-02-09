// Performance optimization utilities
export const rafThrottle = (callback: () => void) => {
  let rafId: number | null = null;
  
  return () => {
    if (rafId !== null) {
      return;
    }
    
    rafId = requestAnimationFrame(() => {
      callback();
      rafId = null;
    });
  };
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const measurePerformance = (name: string, fn: () => void) => {
  fn();
};

export const lazyLoadComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return React.lazy(importFunc);
};

// Image optimization
export const optimizeImage = (src: string, width?: number, quality = 80) => {
  if (!src.includes('supabase.co')) return src;
  
  const url = new URL(src);
  url.searchParams.set('width', width?.toString() || '800');
  url.searchParams.set('quality', quality.toString());
  return url.toString();
};

// Memory management
export const cleanupMemory = () => {
  // Memory cleanup placeholder
};