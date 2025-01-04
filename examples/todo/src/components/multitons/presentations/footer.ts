import { fics } from 'ficsjs'
import { variable } from 'ficsjs/css'

export default fics({
  name: 'footer',
  html: ({ template }) => template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`,
  css: {
    selector: 'footer',
    style: { paddingBlock: variable('md') },
    nested: { selector: 'p', style: { fontSize: variable('sm') } }
  }
})
