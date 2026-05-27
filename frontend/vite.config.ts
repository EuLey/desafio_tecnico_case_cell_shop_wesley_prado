import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api → backend em localhost:3001 (evita CORS no dev)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
