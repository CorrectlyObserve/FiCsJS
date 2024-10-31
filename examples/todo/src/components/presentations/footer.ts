import { fics } from 'ficsjs'

export default fics({
  name: 'footer',
  html: ({ $template }) => $template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`,
  css: {
    selector: 'footer',
    style: { paddingBlock: 'var(--md)' },
    nested: { selector: 'p', style: { fontSize: 'var(--sm)' } }
  },
  options: { immutable: true }
})
