import { defineConfig } from 'vite'
import { resolve } from 'path'

const getPackage = (directory: string) => `./../../packages/${directory}/index`

export default defineConfig({
  resolve: {
    alias: {
      '@ficsjs': resolve(__dirname, getPackage('core')),
      '@ficsjs/router': resolve(__dirname, getPackage('router')),
      '@ficsjs/state': resolve(__dirname, getPackage('state')),
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input: 'index.html' },
    minify: true
  },
  server: { hmr: true }
})
