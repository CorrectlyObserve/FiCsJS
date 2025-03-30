export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    cssnano: {
      preset: [
        'default',
        { discardComments: { removeAll: true }, minifyFontValues: true, normalizeWhitespace: true }
      ]
    }
  }
}
