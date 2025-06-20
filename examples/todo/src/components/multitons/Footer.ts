import { fics } from 'ficsjs'
import { cssVar } from 'ficsjs/style'

export default fics({
  name: 'footer',
  html: ({ template }) => template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`,
  css: { footer: { paddingBottom: cssVar('md'), p: { fontSize: cssVar('sm') } } }
})
