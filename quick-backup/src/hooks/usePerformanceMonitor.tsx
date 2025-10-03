import { useEffect } from 'react';

interface PerformanceData {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

// Performance monitoring hook for development
export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        const perfData: PerformanceData = {
          componentName,
          renderTime,
          timestamp: Date.now()
        };
        
        // Log slow renders (>16ms for 60fps)
        if (renderTime > 16) {
          console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
        }
        
        // Store in session storage for debugging
        const existingData = JSON.parse(sessionStorage.getItem('performance-data') || '[]');
        existingData.push(perfData);
        
        // Keep only last 100 entries
        if (existingData.length > 100) {
          existingData.shift();
        }
        
        sessionStorage.setItem('performance-data', JSON.stringify(existingData));
      };
    }
  }, [componentName]);
};

// Helper to get performance data
export const getPerformanceData = (): PerformanceData[] => {
  return JSON.parse(sessionStorage.getItem('performance-data') || '[]');
};

// Helper to clear performance data
export const clearPerformanceData = () => {
  sessionStorage.removeItem('performance-data');
};
