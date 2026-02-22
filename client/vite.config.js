import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy API requests to the backend.
const backend = process.env.VITE_BACKEND_URL || 'http://localhost:5050';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/movies': { target: backend, changeOrigin: true },
      '/metrics': { target: backend, changeOrigin: true },
      '/health': { target: backend, changeOrigin: true },
    },
  },
  // ✅ 新增：将 Vitest 配置合并到这里
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // 这一行可以确保测试环境也像开发环境一样处理 JSX
    globals: true, 
  },
});