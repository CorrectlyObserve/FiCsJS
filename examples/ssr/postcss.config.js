export default {
  plugins: {
    '@tailwindcss/postcss': {},
    cssnano: {
      preset: [
        'default',
        { discardComments: { removeAll: true }, minifyFontValues: true, normalizeWhitespace: true }
      ]
    }
  }
}
