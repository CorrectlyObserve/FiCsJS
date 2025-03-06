import { defineConfig } from 'vite'

export default defineConfig({
  resolve: { alias: { '@': '/src' } },
  build: { outDir: 'dist', target: 'esnext', emptyOutDir: true, minify: true },
  server: { hmr: true, host: true }
})
