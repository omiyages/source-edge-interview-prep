
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
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-toast'],
          'supabase': ['@supabase/supabase-js'],
          'query': ['@tanstack/react-query'],
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
    exclude: []
  }
}));
