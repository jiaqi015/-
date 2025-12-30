import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 显式映射 process.env 以支持第三方库的旧式引用
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.BLOB_READ_WRITE_TOKEN': JSON.stringify(process.env.BLOB_READ_WRITE_TOKEN || ''),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      // 确保构建器尝试解析所有 node_modules 依赖
      external: [],
    }
  }
});