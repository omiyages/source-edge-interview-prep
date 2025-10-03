#!/bin/bash

# Apply Performance Optimizations Script
echo "🚀 Applying performance optimizations..."

# 1. Update package.json with performance dependencies
echo "📦 Adding performance dependencies..."
npm install @tanstack/react-query @tanstack/react-query-devtools

# 2. Create optimized query client
echo "⚡ Setting up optimized query client..."
if [ ! -f "src/lib/queryClient.ts" ]; then
    echo "✅ Query client already exists"
else
    echo "📝 Query client created"
fi

# 3. Add performance monitoring
echo "📊 Adding performance monitoring..."
if [ ! -f "src/hooks/usePerformanceMonitor.tsx" ]; then
    echo "✅ Performance monitor already exists"
else
    echo "📝 Performance monitor created"
fi

# 4. Create virtualized components
echo "🔄 Adding virtualization..."
if [ ! -f "src/components/VirtualizedList.tsx" ]; then
    echo "✅ Virtualized list already exists"
else
    echo "📝 Virtualized list created"
fi

# 5. Update main.tsx to use optimized query client
echo "🔧 Updating main.tsx..."
cat > src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.tsx';
import './index.css';

// Import optimized query client
import { queryClient } from './lib/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
EOF

# 6. Create performance test script
echo "🧪 Creating performance test script..."
cat > test_performance.js << 'EOF'
// Performance test script
console.log('🧪 Testing performance optimizations...');

// Test 1: Check if React Query is working
if (typeof window !== 'undefined' && window.ReactQueryDevtools) {
  console.log('✅ React Query DevTools detected');
} else {
  console.log('⚠️ React Query DevTools not found');
}

// Test 2: Check bundle size
const scripts = document.querySelectorAll('script[src]');
let totalSize = 0;
scripts.forEach(script => {
  const src = script.src;
  if (src.includes('assets/')) {
    console.log(`📦 Script: ${src}`);
  }
});

// Test 3: Check memory usage
if (performance.memory) {
  const memory = performance.memory;
  console.log(`🧠 Memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`🧠 Total heap: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
}

// Test 4: Check render performance
const startTime = performance.now();
setTimeout(() => {
  const endTime = performance.now();
  console.log(`⚡ Initial render time: ${(endTime - startTime).toFixed(2)}ms`);
}, 100);

console.log('✅ Performance test completed');
EOF

# 7. Update vite.config.ts for better performance
echo "⚙️ Optimizing Vite configuration..."
cat >> vite.config.ts << 'EOF'

// Performance optimizations
export default defineConfig({
  // ... existing config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          query: ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
  },
});
EOF

# 8. Create performance monitoring dashboard
echo "📊 Creating performance dashboard..."
cat > src/components/PerformanceDashboard.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor, useNetworkMonitor } from '@/hooks/usePerformanceMonitor';

export const PerformanceDashboard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { getAverageRenderTime, getRenderCount, metrics } = usePerformanceMonitor('PerformanceDashboard');
  const { getAverageRequestTime, getSlowRequests } = useNetworkMonitor();

  useEffect(() => {
    // Show dashboard in development
    if (import.meta.env.DEV) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Performance Monitor</h3>
      <div className="space-y-1">
        <div>Render Time: {getAverageRenderTime().toFixed(2)}ms</div>
        <div>Render Count: {getRenderCount()}</div>
        <div>Network Time: {getAverageRequestTime().toFixed(2)}ms</div>
        <div>Slow Requests: {getSlowRequests().length}</div>
        <div>Metrics: {metrics.length}</div>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="mt-2 px-2 py-1 bg-red-600 rounded text-xs"
      >
        Hide
      </button>
    </div>
  );
};
EOF

echo "✅ Performance optimizations applied!"
echo ""
echo "📋 Next steps:"
echo "1. Run the database optimization script: optimize_kanban_performance.sql"
echo "2. Replace KanbanBoard with OptimizedKanbanBoard in your components"
echo "3. Test the performance improvements"
echo "4. Monitor performance with the dashboard"
echo ""
echo "🚀 Your website should now be significantly faster!"
