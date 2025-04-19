import { fics } from 'ficsjs'

export default () =>
  fics({
    name: 'footer',
    html: ({ template }) => template`<footer><p>&copy; 2025 Masami Ogasawara</p></footer>`
  })
