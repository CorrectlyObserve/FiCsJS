import { typedFromEntries } from '../core/helpers'
import { toVar } from './others'

const WEIGHTS = typedFromEntries(
  (
    [
      ['regular', '400'],
      ['medium', '500'],
      ['bold', '600']
    ] as const
  ).map(([token, value]) => [token, toVar({ name: 'font-weight', token, value })] as const)
)

/**
 * @remarks
 * Defaults for font-weight, overridable via --fics-font-weight-<token>.
 *
 * - regular: 400
 * - medium: 500
 * - bold: 600
 * 
 * @returns `font-weight: <value>`
 */
export const fontWeight = (token: keyof typeof WEIGHTS): string => `font-weight: ${WEIGHTS[token]}`
