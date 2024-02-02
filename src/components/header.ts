import fics from '../packages/core/fics'

const Header = (css: string) =>
  fics({
    name: 'header',
    data: () => ({ title: 'To Do App by FiCsJS', pink: '#e198b4' }),
    html: ({ data: { title }, template }) => template`<header><h1>${title}</h1></header>`,
    css: [
      css,
      { selector: 'header', style: { padding: 'var(--md) 0' } },
      {
        selector: 'header h1',
        style: ({ data: { pink } }) => ({
          background: `linear-gradient(30deg, var(--red) 20%, ${pink})`,
          backgroundClip: 'text',
          webkitTextFillColor: 'transparent',
          textAlign: 'center'
        })
      }
    ]
  })

export default Header
