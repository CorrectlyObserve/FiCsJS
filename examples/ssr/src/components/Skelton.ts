import { fics } from 'ficsjs'
import { color } from 'ficsjs/style'

export default () =>
  fics({
    name: 'skelton',
    html: ({ template }) => template`<div class="skelton size-50 block mx-auto animate-pulse"></div>`,
    css: { 'div.skelton': { background: color({ hex: '#fff', rate: 0.05 }) } }
  })
