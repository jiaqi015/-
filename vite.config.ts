
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // 强制输出到 build 目录，解决 Vercel 找不到目录的问题
    outDir: 'build',
    // 确保每次构建都会清空旧目录
    emptyOutDir: true,
    // 保持兼容性配置
    target: 'esnext'
  }
});
