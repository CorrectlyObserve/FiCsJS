import { fics } from 'ficsjs'
import { pulse } from 'ficsjs/animation'
import { white } from '@/utils'

export default fics({
  name: 'skeleton',
  html: ({ template }) =>
    template`<div class="skeleton size-50 mx-auto"></div>`,
  css: { 'div.skeleton': { background: white(0.05), ...pulse() } }
})
