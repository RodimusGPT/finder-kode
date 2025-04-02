import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Allow 'unsafe-eval' and 'unsafe-inline' for development only to address CSP issues
      // Note: Review security implications before using in production
      'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    },
  },
  build: {
    outDir: 'build',
  }
});
