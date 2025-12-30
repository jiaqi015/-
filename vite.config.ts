import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 构建时将系统环境变量 API_KEY 注入到浏览器环境
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  }
});