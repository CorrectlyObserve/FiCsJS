import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  base: './', // Setting relative path
  css: { postcss: { plugins: [require('autoprefixer')] } },
  plugins: [legacy({ targets: ['defaults', 'not IE 11'] })],
  server: { port: 1759 },
})
