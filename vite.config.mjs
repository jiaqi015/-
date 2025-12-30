import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  cacheDir: ".vite-cache",
  define: {
    // 关键修复：不要直接用 JSON.stringify 替换常量
    // 而是定义一个动态逻辑，优先读取运行时环境中的 Key
    'process.env': '({ API_KEY: (typeof window !== "undefined" && (window.process?.env?.API_KEY || window.API_KEY)) || "" })'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  }
});