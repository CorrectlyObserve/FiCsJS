import { fics, html } from '../packages/core/fics'

const Header = () =>
  fics({
    name: 'header',
    data: () => ({
      title: 'To Do App by FiCsJS',
      md: 'var(--md)',
      pink: '#e198b4'
    }),
    html: ({ data: { title } }) => html`<header><h1 align="center">${title}</h1></header>`,
    css: [
      `h1 { -webkit-text-fill-color: transparent; }`,
      {
        selector: 'header',
        style: ({ data: { md } }) => ({ padding: `${md} 0`, marginBottom: md })
      },
      {
        selector: 'h1',
        style: ({ data: { pink } }) => ({
          background: `linear-gradient(30deg, var(--red) 20%, ${pink})`,
          backgroundClip: 'text',
          margin: 0
        })
      }
    ]
  })

export default Header
