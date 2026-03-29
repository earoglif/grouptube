import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: {
      origin: [/chrome-extension:\/\//],
    },
    hmr: {
      host: '127.0.0.1',
      port: 5173,
      protocol: 'ws',
    },
  },
})
