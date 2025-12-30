import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 注入 process.env.API_KEY，确保 AI 模块能正常读取密钥
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    // 兼容某些三方库对 process.env 的访问
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'global': 'globalThis'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false
  },
  server: {
    historyApiFallback: true
  }
});