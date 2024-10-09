import { fics } from 'ficsjs'

export default () =>
  fics({
    name: 'footer',
    isImmutable: true,
    html: ({ $template }) => $template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`,
    css: [
      { selector: 'footer', style: { padding: 'var(--md) 0' } },
      {
        selector: 'footer p',
        style: { fontSize: 'var(--sm)', color: '#fff', textAlign: 'center', lineHeight: '100%' }
      }
    ]
  })