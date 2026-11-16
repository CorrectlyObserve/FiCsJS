import { addGlobalCss, getGlobalCss } from '../core/css'
import { PULSE_OPACITY_VAR, VIBRATE_UNIT_VAR } from './constants'

const translate3d = (multiplier: number): string =>
  `translate3d(calc(var(${VIBRATE_UNIT_VAR}) * ${multiplier}), 0, 0)`

addGlobalCss(`
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:var(${PULSE_OPACITY_VAR})}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes vibrate{
    10%,90%{transform:${translate3d(-1)}}
    20%,80%{transform:${translate3d(1)}}
    30%,50%,70%{transform:${translate3d(-2)}}
    40%,60%{transform:${translate3d(2)}}
  }
`)

export { getGlobalCss }
export { pulse, spin } from './loading'
export { fade, float, slide, zoom } from './transition'
export { vibrate } from './vibrate'
