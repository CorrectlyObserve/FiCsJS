import { defineConfig } from 'vite'
import { resolve } from 'path'

const getPackage = (directory: string) => `./../../packages/${directory}/index`

export default defineConfig({
  resolve: {
    alias: {
      '@ficsjs/router': resolve(__dirname, getPackage('router')),
      '@ficsjs/state': resolve(__dirname, getPackage('state')),
      '@ficsjs': resolve(__dirname, getPackage('core')),
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input: { en: 'index.html', ja: 'ja.html' } },
    minify: true
  },
  server: { hmr: true }
})
