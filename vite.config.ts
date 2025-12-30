import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 将环境变量注入到浏览器端代码中
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.BLOB_READ_WRITE_TOKEN': JSON.stringify(process.env.BLOB_READ_WRITE_TOKEN || ''),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      // 显式确保 Rollup 不会错误地将依赖标记为外部模块
      external: [],
    }
  }
});