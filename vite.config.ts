import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/screenshots': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/placeholder.svg': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
