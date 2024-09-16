import fics from '@ficsjs'

const copyright = '&copy; 2024 Masami Ogasawara'

const Footer = (css: string) =>
  fics({
    name: 'footer',
    isImmutable: true,
    html: ({ $template }) => $template`<footer><p>${copyright}</p></footer>`,
    css: [
      css,
      { selector: 'footer', style: { padding: 'var(--md) 0' } },
      {
        selector: 'footer p',
        style: { fontSize: 'var(--sm)', color: '#fff', textAlign: 'center', lineHeight: '100%' }
      }
    ]
  })

export default Footer
