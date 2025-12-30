import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 确保 process.env 在客户端运行时不报错
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || "production"),
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
  },
  // 强制 Vite 处理模块解析
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  }
});