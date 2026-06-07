import { defineConfig } from 'vite'
import { routesPlugin } from 'ficsjs/router/plugin'

export default defineConfig({
  plugins: [routesPlugin()],
  resolve: { alias: { '@': '/src' } },
  build: { outDir: 'dist', target: 'esnext', emptyOutDir: true, minify: true },
  server: { hmr: true, host: true }
})
