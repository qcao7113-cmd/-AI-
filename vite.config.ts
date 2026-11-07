import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5175,
    strictPort: false,
    // 部分编辑器的原子写入临时目录会触发 EBUSY，改用轮询更稳定
    watch: { usePolling: true, interval: 300 },
  },
})
