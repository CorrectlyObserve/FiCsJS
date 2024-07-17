import { defineConfig } from 'vite'
import { resolve } from 'path'
import { glob } from 'glob'

export default defineConfig({
  root: resolve(__dirname, 'src'),
  build: {
    emptyOutDir: true,
    outDir: '../dist',
    rollupOptions: { input: glob.sync('src/*.html') },
    minify: true
  },
  server: { hmr: true }
})
