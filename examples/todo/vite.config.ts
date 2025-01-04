import { defineConfig } from 'vite'
import { resolve } from 'path'

const getPackage = (directory: string): string =>
  resolve(__dirname, `./../../packages/${directory}/index`)

export default defineConfig({
  resolve: {
    alias: {
      'ficsjs/css': getPackage('css'),
      'ficsjs/i18n': getPackage('i18n'),
      'ficsjs/router': getPackage('router'),
      'ficsjs/state': getPackage('state'),
      ficsjs: getPackage('core'),
      '@': '/src'
    }
  },
  plugins: [
    {
      name: 'ja',
      configureServer(server) {
        server.middlewares.use((req, _, next) => {
          if (req.url?.startsWith('/ja/')) req.url = './ja.html'
          next()
        })
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input: { en: 'index.html', ja: 'ja.html' } },
    minify: true
  },
  server: { hmr: true }
})
