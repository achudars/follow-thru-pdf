import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // This proxy is used when running Vite directly (npm run dev inside frontend/).
    // With `netlify dev` from the project root, Netlify Dev handles /api/* → functions.
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/(.+)$/, '/.netlify/functions/$1'),
      },
    },
  },
})
