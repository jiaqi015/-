import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  cacheDir: ".vite-cache",
  define: {
    'process.env.API_KEY': JSON.stringify("AIzaSyCB_TbsqsVWUJ8gI9QN6OshkQ7UEZxI_QM")
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  }
});