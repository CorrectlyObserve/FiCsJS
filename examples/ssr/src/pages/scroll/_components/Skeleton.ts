import { fics } from 'ficsjs'
import { white } from '@/utils'

export default fics({
  name: 'skeleton',
  html: ({ template }) =>
    template`<div class="skeleton size-50 mx-auto animate-pulse"></div>`,
  css: { 'div.skeleton': { background: white(0.05) } }
})
