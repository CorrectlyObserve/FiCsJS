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
        todo: resolve(__dirname, root, 'todo/index.html'),
        iframe: resolve(__dirname, root, 'iframe/index.html')
      }
    }
  }
})
