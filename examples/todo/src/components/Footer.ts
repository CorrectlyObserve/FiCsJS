import { fics } from 'ficsjs'
import { size, textSize } from 'ficsjs/style'

export default fics({
  name: 'footer',
  html: ({ template }) => template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`,
  css: ({ cssToString }) => `
    footer {
      padding-block-end: ${size(4)};

      p {${cssToString(textSize('sm'))}}
    }
  `
})
