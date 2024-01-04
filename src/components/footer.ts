import { fics, html } from '../packages/core/fics'

const Footer = () =>
  fics({
    name: 'footer',
    data: () => ({ copyright: '&copy; 2023 Masami Ogasawara' }),
    html: ({ data: { copyright } }) => html`<footer><p align="center">${copyright}</p></footer>`,
    css: [
      { selector: 'footer', style: () => ({ padding: 'var(--md) 0' }) },
      { selector: 'footer > p', style: () => ({ fontSize: 'var(--md)', color: '#fff', margin: 0 }) }
    ]
  })

export default Footer
