
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // 注入 process.env.API_KEY，确保 AI 模块能正常读取密钥
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    // 防止某些库在浏览器中寻找 global process 对象而崩溃
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  },
  server: {
    historyApiFallback: true
  }
});
