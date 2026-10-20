import { typedFromEntries } from '../core/helpers'
import { toVar } from './others'
import { size } from './size'

const TOKENS = typedFromEntries(
    (['xs', 'sm', 'md', 'lg', 'xl'] as const).map(
      (token, index) => [token, toVar({ name: 'space', token, value: size(2 ** index) })] as const
    )
  ),
  SPACES = {
    ...TOKENS,
    ...typedFromEntries(
      (['md'] as const).flatMap(
        token =>
          [
            [`${token}-`, `calc(${TOKENS[token]} * 0.75)`],
            [`${token}+`, `calc(${TOKENS[token]} * 1.5)`]
          ] as const
      )
    )
  }

/**
 * @remarks
 * The defaults, each overridable through --fics-space-<token>; md- and md+ follow --fics-space-md:
 * - xs: 0.25rem
 * - sm: 0.5rem
 * - md-: 0.75rem
 * - md: 1rem
 * - md+: 1.5rem
 * - lg: 2rem
 * - xl: 4rem
 */
export const space = (token: keyof typeof SPACES): string => SPACES[token]
