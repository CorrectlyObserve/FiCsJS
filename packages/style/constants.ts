import { ficsCssVar } from '../core/helpers'

/** @remarks The base color the tint mixes into (usually transparent, or the solid paint inside `fill()`). */
export const TINT_BASE_VAR = ficsCssVar('tint-base'),
  TINT_SCALE_VAR = ficsCssVar('tint-scale'),
  /** @remarks The hover/press tint color (usually the text color, or inverted inside `fill()`). */
  TINT_VAR = ficsCssVar('tint')
