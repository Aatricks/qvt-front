import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev convenience: proxy frontend /api calls to the FastAPI backend.
// In production you can set VITE_API_BASE_URL to point to your backend.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
