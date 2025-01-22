import { fics } from 'ficsjs'
import { variable } from 'ficsjs/style'
import breakpoints from '@/breakpoints'

export default fics({
  name: 'footer',
  html: ({ template }) => template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`,
  css: {
    footer: {
      paddingBlock: variable('md'),
      p: { fontSize: variable('sm') },
      [`@media (max-width: ${breakpoints.sm})`]: { paddingBlock: variable('xs') }
    }
  }
})
