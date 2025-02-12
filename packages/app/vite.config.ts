import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), tailwindcss(), nodePolyfills()],
  define: {
    'process.env': {},
    global: {},
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/, /@splerg\/sdk/],
    },
    rollupOptions: {
      external: [
        'react',
        'react-router',
        'react-router-dom',
        '@solana/wallet-adapter-base',
        '@solana/wallet-adapter-base-ui',
        '@solana/wallet-adapter-react',
        '@solana/wallet-adapter-react-ui',
        '@solana/web3.js'
      ],
      output: {
        globals: {
          react: 'React',
          'react-router': 'ReactRouter',
          'react-router-dom': 'ReactRouterDOM',
          '@solana/wallet-adapter-base': 'SolanaWalletAdapterBase',
          '@solana/wallet-adapter-base-ui': 'SolanaWalletAdapterBaseUI',
          '@solana/wallet-adapter-react': 'SolanaWalletAdapterReact',
          '@solana/wallet-adapter-react-ui': 'SolanaWalletAdapterReactUI',
          '@solana/web3.js': 'SolanaWeb3'
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@splerg/sdk'],
  },
  resolve: {
    preserveSymlinks: true,
  },
});