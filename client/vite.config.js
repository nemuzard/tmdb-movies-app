import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Proxy API requests to the Express server running on port 5050
// This allows the React frontend to communicate with the backend without CORS issues
// avoiding hardcoding the backend URL in the frontend code
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/movies': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/metrics': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      }
    }
  }
})
