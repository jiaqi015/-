import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 明确定义环境变量，确保 process.env 在浏览器中可用
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || "production"),
    // 整体定义 process.env 对象以兼容部分依赖库的访问方式
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