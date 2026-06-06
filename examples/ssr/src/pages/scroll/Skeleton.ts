import { fics, type FiCs } from 'ficsjs'
import { pulse } from 'ficsjs/animation'
import { white } from '@/utils'

const html: FiCs.Html<{}, {}> = ({ template }) => template`<div class="size-50 mx-auto"></div>`
const css: FiCs.Css<{}, {}> = ({ cssToString }) =>
  `div { background: ${white(0.05)}; ${cssToString(pulse())} }`

export default fics({ name: 'skeleton', html, css })
