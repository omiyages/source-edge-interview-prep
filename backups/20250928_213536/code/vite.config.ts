
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    include: ['react', 'react-dom', 'react-router-dom']
  }
}));
