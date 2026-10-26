import { ficsCssVar } from '../core/helpers'

/**
 * @remarks
 * Defaults for layout, overridable via --fics-layout.
 *
 * - compact: width < 40rem
 * - regular: 40rem <= width < 64rem
 * - expanded: width >= 64rem
 */
export const layout = (size: 'compact' | 'regular' | 'expanded'): string =>
  `style(${ficsCssVar('layout')}: ${size})`
