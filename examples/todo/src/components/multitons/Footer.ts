import { fics } from 'ficsjs'
import { variable } from 'ficsjs/style'

export default () =>
  fics({
    name: 'footer',
    html: ({ template }) => template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`,
    css: {
      footer: { paddingBottom: variable('md'), p: { fontSize: variable('sm') } }
    }
  })
