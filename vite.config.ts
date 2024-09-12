import { defineConfig } from 'vite'
import { resolve } from 'path'
import path from 'path'

export default defineConfig({
  root: resolve(__dirname, 'src'),
  plugins: [
    {
      name: 'spa',
      configureServer(server) {
        server.middlewares.use((req, _, next) => {
          if (req.url?.startsWith('/pages/router')) req.url = '/pages/router/index.html'
          next()
        })
      }
    }
  ],
  build: {
    emptyOutDir: true,
    outDir: '../dist',
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'src', 'pages/index.html'),
        spa: path.resolve(__dirname, 'src', 'pages/router/index.html')
      }
    },
    minify: true
  },
  server: { hmr: true }
})
