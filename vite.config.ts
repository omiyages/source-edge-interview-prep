
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { compression } from "vite-plugin-compression2";
import path from "path";

const googleSearchConsolePlugin = () => ({
  name: "google-search-console-meta",
  transformIndexHtml(html: string) {
    const verificationToken =
      process.env.VITE_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION;

    if (!verificationToken) {
      return html;
    }

    return html.replace(
      "</head>",
      `    <meta name="google-site-verification" content="${verificationToken}" />\n  </head>`
    );
  },
});

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
    googleSearchConsolePlugin(),
    // Gzip compression for production builds (~70% smaller transfers)
    mode === 'production' && compression({ algorithm: 'gzip', threshold: 1024 }),
    // Brotli compression for modern browsers (~80% smaller transfers)
    mode === 'production' && compression({ algorithm: 'brotliCompress', threshold: 1024 }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['@supabase/supabase-js']
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return;

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/') ||
            id.includes('/scheduler/')
          ) return 'react-vendor';

          if (
            id.includes('/@supabase/supabase-js/') ||
            id.includes('/@supabase/postgrest-js/') ||
            id.includes('/@supabase/realtime-js/') ||
            id.includes('/@supabase/storage-js/') ||
            id.includes('/@supabase/functions-js/') ||
            id.includes('/@supabase/auth-js/')
          ) return 'supabase';

          if (
            id.includes('/@radix-ui/')
          ) return 'ui-vendor';

          if (id.includes('/@tanstack/react-query/')) return 'query';
          if (id.includes('/@clerk/react/')) return 'clerk';

          if (
            id.includes('/date-fns/') ||
            id.includes('/zod/') ||
            id.includes('/clsx/') ||
            id.includes('/class-variance-authority/') ||
            id.includes('/tailwind-merge/')
          ) return 'utils';
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
    target: 'esnext',
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
