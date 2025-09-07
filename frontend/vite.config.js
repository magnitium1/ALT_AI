import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Clean single export with proxy to backend on 8070
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8070',
        changeOrigin: true,
        secure: false,
      },
      '/login': {
        target: 'http://localhost:8070',
        changeOrigin: true,
        secure: false,
      },
      '/register': {
        target: 'http://localhost:8070',
        changeOrigin: true,
        secure: false,
      },
      '/request_to_model': {
        target: 'http://localhost:8070',
        changeOrigin: true,
        secure: false,
      },
      '/chats': {
        target: 'http://localhost:8070',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
