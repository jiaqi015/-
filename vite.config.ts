
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 注入环境变量，确保在浏览器中可用
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.BLOB_READ_WRITE_TOKEN': JSON.stringify(process.env.BLOB_READ_WRITE_TOKEN || ''),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      // 标记在 index.html importmap 中定义的模块为外部模块
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@google/genai',
        '@vercel/blob'
      ],
    }
  }
});
