import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 必须定义 process.env 以免浏览器端抛出 'process is not defined' 错误
    'process.env': {
      API_KEY: process.env.API_KEY || "",
      NODE_ENV: process.env.NODE_ENV || "production"
    },
    'global': 'globalThis'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  }
});