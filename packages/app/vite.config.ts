import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      globals: {
        Buffer: true
      }
    })
  ],
  define: {
    'process.env': {}
  },
  resolve: {
    alias: {
      'react-router-dom': path.resolve('./node_modules/react-router-dom'),
    },
  },
})