import { addGlobalCss, getDocumentCss } from '../core/css'
import { CSS_LAYER } from '../core/helpers'
import { color, fill, gradient, oklch } from './color'
import { stroke } from './stroke'

addGlobalCss(
  `${CSS_LAYER}{:focus-visible{outline:${stroke('md')} solid ${color('focus')};outline-offset:0}}`
)

export { color, fill, getDocumentCss, gradient, oklch, stroke }
export { flex } from './flex'
export { fontWeight } from './fontWeight'
export { forScreenReaders } from './forScreenReaders'
export { interactive } from './interactive'
export { maskIcon } from './maskIcon'
export { motion } from './motion'
export { calc, cssVar, hideScrollbar, layout, remToPx } from './others'
export { positionCenter } from './positionCenter'
export { radius } from './radius'
export { circle, rect, size } from './size'
export { space } from './space'
export { tapSize } from './tapSize'
export { textSize } from './textSize'
export { truncate } from './truncate'
