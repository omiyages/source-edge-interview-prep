import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Optimized Vite configuration for better performance
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: ['es2020', 'chrome80', 'firefox80', 'safari14'],
    minify: 'esbuild',
    cssCodeSplit: true, // Enable CSS code splitting
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          
          // Routing
          'router': ['react-router-dom'],
          
          // UI Components - split by usage frequency
          'ui-core': [
            '@radix-ui/react-slot', 
            '@radix-ui/react-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-button'
          ],
          'ui-forms': [
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label'
          ],
          'ui-layout': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-collapsible'
          ],
          
          // Data & State Management
          'supabase': ['@supabase/supabase-js'],
          'query': ['@tanstack/react-query'],
          
          // Forms & Validation
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Rich Text Editor
          'editor': ['react-quill'],
          
          // Charts & Visualization
          'charts': ['recharts'],
          
          // Utilities
          'utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          
          // Icons
          'icons': ['lucide-react'],
          
          // Drag & Drop
          'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          
          // Theme
          'theme': ['next-themes']
        },
        // Optimize chunk size
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // Optimize chunk size warning
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging in production
    sourcemap: mode === 'development'
  },
  esbuild: {
    target: 'es2020',
    // Remove console logs in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ],
    // Exclude heavy dependencies from pre-bundling
    exclude: ['react-quill', 'recharts']
  },
  // CSS optimization
  css: {
    devSourcemap: mode === 'development'
  }
}));
