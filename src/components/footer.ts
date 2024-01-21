import fics from '../packages/core/fics'

const Footer = (css: string) =>
  fics({
    name: 'footer',
    data: () => ({ copyright: '&copy; 2023 Masami Ogasawara', md: 'var(--md)' }),
    html: ({ data: { copyright }, html }) => html`<footer><p>${copyright}</p></footer>`,
    css: [
      css,
      { selector: 'footer', style: ({ data: { md } }) => ({ padding: `${md} 0` }) },
      {
        selector: 'footer p',
        style: ({ data: { md } }) => ({ fontSize: md, color: '#fff', textAlign: 'center' })
      }
    ]
  })

export default Footer
