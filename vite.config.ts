import { defineConfig } from 'vite'
import { resolve } from 'path'

const root = 'src'

export default defineConfig({
  root,
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, root, 'index.html'),
        privacy: resolve(__dirname, root, 'todo/index.html')
      }
    }
  }
})
