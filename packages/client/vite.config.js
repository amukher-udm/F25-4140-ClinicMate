import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    },
    allowedHosts: [
          'f25-4140-clinicmate-backend.onrender.com',
          // Add other allowed hosts if necessary
    ],
  }
});
