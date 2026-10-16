import { fics, type FiCs } from 'ficsjs'
import { space, textSize } from 'ficsjs/style'

const html: FiCs.Html<{}, {}> = ({ template }) =>
  template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`

const css: FiCs.Css<{}, {}> = `
  footer {
    padding-block-end: ${space('md')};

    p {${textSize('sm')}}
  }
`

export default fics({ name: 'footer', html, css })
