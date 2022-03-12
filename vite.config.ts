import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  return {
    base: './', // Setting relative path
    build: {
      rollupOptions: {
        plugins: [
          mode === 'analyze' &&
            visualizer({
              open: true,
              filename: 'dist/analytics.html',
              gzipSize: true, // The method to compress files
              brotliSize: true, // The compression algorithm
            }),
        ],
      },
    },
    css: { postcss: { plugins: [require('autoprefixer')] } },
    plugins: [legacy({ targets: ['defaults', 'not IE 11'] })],
    server: { port: 1759 },
  }
})
