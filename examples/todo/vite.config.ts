import { defineConfig } from 'vite'
import { resolve } from 'path'

const getPackage = (directory: string): string =>
  resolve(__dirname, `./../../packages/${directory}/index`)

export default defineConfig({
  resolve: {
    alias: {
      'ficsjs/i18n': getPackage('i18n'),
      'ficsjs/persistent-state': getPackage('persistent-state'),
      'ficsjs/router': getPackage('router'),
      'ficsjs/state': getPackage('state'),
      'ficsjs/style': getPackage('style'),
      ficsjs: getPackage('core'),
      '@': '/src'
    }
  },
  build: { outDir: 'dist', target: 'esnext', emptyOutDir: true, minify: true },
  server: { hmr: true, host: true }
})
