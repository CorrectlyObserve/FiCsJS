import { addGlobalCss } from '../core/css'
import { PULSE_OPACITY, VIBRATE_UNIT } from './constants'

const translate3d = (multiplier: number): string =>
  `translate3d(calc(var(${VIBRATE_UNIT}) * ${multiplier}), 0, 0)`

addGlobalCss(`
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:var(${PULSE_OPACITY})}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes vibrate{
    10%,90%{transform:${translate3d(-1)}}
    20%,80%{transform:${translate3d(1)}}
    30%,50%,70%{transform:${translate3d(-2)}}
    40%,60%{transform:${translate3d(2)}}
  }
`)

export { pulse, spin } from './loading'
export { fade, float, slide, zoom } from './transition'
export { vibrate } from './vibrate'
