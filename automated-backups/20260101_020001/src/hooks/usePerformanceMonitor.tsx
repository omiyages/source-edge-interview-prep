import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentName: string;
  timestamp: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Get memory usage if available
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      const newMetric: PerformanceMetrics = {
        renderTime,
        memoryUsage,
        componentName,
        timestamp: Date.now(),
      };

      setMetrics(prev => [...prev.slice(-9), newMetric]); // Keep last 10 metrics
      
      // Log slow renders
      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      
      // Log memory usage
      if (memoryUsage > 50 * 1024 * 1024) { // More than 50MB
        console.warn(`🧠 High memory usage in ${componentName}: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }
    };
  });

  const getAverageRenderTime = () => {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, metric) => sum + metric.renderTime, 0) / metrics.length;
  };

  const getAverageMemoryUsage = () => {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, metric) => sum + metric.memoryUsage, 0) / metrics.length;
  };

  const getRenderCount = () => renderCount.current;

  const clearMetrics = () => {
    setMetrics([]);
    renderCount.current = 0;
  };

  return {
    metrics,
    getAverageRenderTime,
    getAverageMemoryUsage,
    getRenderCount,
    clearMetrics,
  };
};

// Hook for monitoring specific operations
export const useOperationTimer = () => {
  const [operations, setOperations] = useState<Record<string, number[]>>({});

  const startTimer = (operationName: string) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setOperations(prev => ({
        ...prev,
        [operationName]: [...(prev[operationName] || []).slice(-9), duration],
      }));
      
      if (duration > 100) { // More than 100ms
        console.warn(`⏱️ Slow operation ${operationName}: ${duration.toFixed(2)}ms`);
      }
    };
  };

  const getAverageTime = (operationName: string) => {
    const times = operations[operationName];
    if (!times || times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  };

  const clearOperations = () => {
    setOperations({});
  };

  return {
    startTimer,
    getAverageTime,
    operations,
    clearOperations,
  };
};

// Hook for monitoring network requests
export const useNetworkMonitor = () => {
  const [requests, setRequests] = useState<Array<{
    url: string;
    method: string;
    duration: number;
    status: number;
    timestamp: number;
  }>>([]);

  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      const method = (args[1] as RequestInit)?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        setRequests(prev => [...prev.slice(-19), {
          url,
          method,
          duration,
          status: response.status,
          timestamp: Date.now(),
        }]);
        
        // Log slow requests
        if (duration > 1000) { // More than 1 second
          console.warn(`🌐 Slow network request: ${method} ${url} - ${duration.toFixed(2)}ms`);
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        setRequests(prev => [...prev.slice(-19), {
          url,
          method,
          duration,
          status: 0,
          timestamp: Date.now(),
        }]);
        
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const getAverageRequestTime = () => {
    if (requests.length === 0) return 0;
    return requests.reduce((sum, req) => sum + req.duration, 0) / requests.length;
  };

  const getSlowRequests = (threshold: number = 500) => {
    return requests.filter(req => req.duration > threshold);
  };

  const clearRequests = () => {
    setRequests([]);
  };

  return {
    requests,
    getAverageRequestTime,
    getSlowRequests,
    clearRequests,
  };
};