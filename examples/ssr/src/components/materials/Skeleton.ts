import { fics } from 'ficsjs'
import { color } from 'ficsjs/style'

export default () =>
  fics({
    name: 'skeleton',
    html: ({ template }) => template`
      <div class="skeleton size-50 block mx-auto animate-pulse"></div>
    `,
    css: { 'div.skeleton': { background: color({ hex: '#fff', rate: 0.05 }) } }
  })
