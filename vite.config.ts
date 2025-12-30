
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // 注入 process.env.API_KEY，确保 AI 模块能正常读取密钥
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    // 兼容某些三方库对 process.env 的访问
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  build: {
    // 强制输出到 dist，与 vercel.json 保持一致
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
