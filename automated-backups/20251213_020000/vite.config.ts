
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Vite plugin to handle Supabase module issues
const supabasePlugin = () => ({
  name: 'supabase-fix',
  configResolved(config) {
    // Force include Supabase modules in optimization
    if (config.optimizeDeps) {
      config.optimizeDeps.include = config.optimizeDeps.include || [];
      config.optimizeDeps.include.push(
        '@supabase/supabase-js',
        '@supabase/postgrest-js',
        '@supabase/realtime-js',
        '@supabase/storage-js'
      );
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      port: 8080,
      host: "localhost"
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },
  plugins: [
    react(),
    supabasePlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['@supabase/supabase-js']
  },
  build: {
    target: ['es2020', 'chrome80', 'firefox80', 'safari14'],
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: (id) => {
          // React core
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          // Router
          if (id.includes('react-router')) {
            return 'router';
          }
          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'ui-components';
          }
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // React Query
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          // Large libraries
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('mapbox')) {
              return 'charts-maps';
            }
            if (id.includes('date-fns') || id.includes('zod')) {
              return 'utils';
            }
          }
        },
        // Optimize chunk names for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        }
      }
    }
  },
  esbuild: {
    target: 'es2020',
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      '@supabase/postgrest-js',
      '@supabase/realtime-js',
      '@supabase/storage-js'
    ],
    exclude: [],
    // Force pre-bundling for faster dev server startup
    force: false
  },
}));
