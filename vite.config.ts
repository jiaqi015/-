
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // 确保代码中的 process.env 能够被正确替换
    'process.env': process.env
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
