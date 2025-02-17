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
      '@': path.resolve(__dirname, './src'),
      'react-router-dom': path.resolve('./node_modules/react-router-dom'),
    },
  },
  build: {
    sourcemap: true, // This will help us debug if there are issues
    outDir: 'dist',
    assetsDir: 'assets',
  }
})