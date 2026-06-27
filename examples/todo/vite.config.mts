import { defineConfig } from 'vite'
import { viteRoutesPlugin } from 'ficsjs/router/plugin'

export default defineConfig({
  plugins: [viteRoutesPlugin()],
  resolve: { alias: { '@': '/src' } },
  build: { outDir: 'dist', target: 'esnext', emptyOutDir: true, minify: true },
  server: { hmr: true, host: true }
})
