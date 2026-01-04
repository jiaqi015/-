
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 构建时将系统环境变量注入到浏览器环境
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.ALIBABA_API_KEY': JSON.stringify(process.env.ALIBABA_API_KEY || ''),
    'process.env.ALIBABA_WANX_MODEL': JSON.stringify(process.env.ALIBABA_WANX_MODEL || ''),
    'process.env.ALIBABA_QWEN_MODEL': JSON.stringify(process.env.ALIBABA_QWEN_MODEL || ''),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  }
});
