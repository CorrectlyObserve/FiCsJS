import { fics } from 'ficsjs'

export default () =>
  fics({
    name: 'footer',
    html: ({ template }) => template`
      <footer class="text-sm text-white text-center"><p>&copy; 2025 Masami Ogasawara</p></footer>
    `
  })
