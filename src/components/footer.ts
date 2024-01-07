import { fics, html } from '../packages/core/fics'

const Footer = (css: string) =>
  fics({
    name: 'footer',
    data: () => ({ copyright: '&copy; 2023 Masami Ogasawara' }),
    html: ({ data: { copyright } }) => html`<footer><p>${copyright}</p></footer>`,
    css: [
      css,
      { selector: 'footer', style: () => ({ padding: 'var(--md) 0' }) },
      {
        selector: 'footer p',
        style: () => ({ fontSize: 'var(--md)', color: '#fff', textAlign: 'center' })
      }
    ]
  })

export default Footer
