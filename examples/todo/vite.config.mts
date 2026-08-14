import { defineConfig } from 'vite'
import { vitePlugin } from 'ficsjs/router/plugin'

export default defineConfig({
  plugins: [vitePlugin({ title: 'ToDo App created with FiCsJS' })],
  resolve: { alias: { '@': '/src' } },
  build: { outDir: 'dist', target: 'esnext', emptyOutDir: true, minify: true },
  server: { hmr: true, host: true }
})
