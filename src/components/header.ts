import { fics, html } from '../packages/core/fics'

const Header = () =>
  fics({
    name: 'header',
    data: () => ({
      title: 'To Do App by FiCsJS',
      md: 'var(--md)',
      red: '#b7282e',
      pink: '#e7609e'
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
        style: ({ data: { red, pink } }) => ({
          background: `linear-gradient(15deg, ${red} 15%, ${pink})`,
          backgroundClip: 'text',
          margin: 0
        })
      }
    ]
  })

export default Header
