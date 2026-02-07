import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  envDir: '../../',
  server: {
    port: 5173,
  },
})
