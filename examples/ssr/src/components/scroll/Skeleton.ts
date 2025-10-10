import { fics } from 'ficsjs'
import { oklch } from 'ficsjs/style'

export default fics({
  name: 'skeleton',
  html: ({ template }) =>
    template`<div class="skeleton size-50 block mx-auto animate-pulse"></div>`,
  css: { 'div.skeleton': { background: oklch('#fff', { opacity: 0.05 }) } }
})
