
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
    host: "0.0.0.0",
    port: 8080,
    strictPort: false,
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
        manualChunks: {
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'scheduler'
          ],
          'supabase': [
            '@supabase/supabase-js',
            '@supabase/postgrest-js',
            '@supabase/realtime-js',
            '@supabase/storage-js',
            '@supabase/functions-js',
            '@supabase/auth-js'
          ],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-separator',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-avatar',
            '@radix-ui/react-accordion',
            '@radix-ui/react-collapsible'
          ],
          'query': [
            '@tanstack/react-query'
          ],
          'utils': [
            'date-fns',
            'zod',
            'clsx',
            'class-variance-authority',
            'tailwind-merge'
          ]
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
