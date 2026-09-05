import { fics, type FiCs } from 'ficsjs'
import { size, textSize } from 'ficsjs/style'

const html: FiCs.Html<{}, {}> = ({ template }) =>
  template`<footer><p>&copy; 2024 Masami Ogasawara</p></footer>`

const css: FiCs.Css<{}, {}> = `
  footer {
    padding-block-end: ${size(4)};

    p {${textSize('sm')}}
  }
`

export default fics({ name: 'footer', html, css })
