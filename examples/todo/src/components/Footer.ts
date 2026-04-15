import { fics } from 'ficsjs'
import { cssVar } from 'ficsjs/style'

export default fics({
  name: 'footer',
  html: ({ template }) => template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`,
  css: `
    footer {
      padding-block-end: ${size(4)};

      p { font-size: ${cssVar('sm')}; }
    }
  `
})
