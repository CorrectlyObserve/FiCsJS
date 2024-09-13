import { defineConfig } from 'vite'
import { resolve } from 'path'

const packages: string = './../../packages'

export default defineConfig({
  root: resolve(__dirname, 'src'),
  resolve: {
    alias: {
      '@ficsjs': resolve(__dirname, `${packages}/core/index`),
      '@ficsjs/router': resolve(__dirname, `${packages}/router/index`),
      '@ficsjs/state': resolve(__dirname, `${packages}/state/index`),
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src', 'index.html')
    },
    minify: true,
  },
  server: { hmr: true }
})
