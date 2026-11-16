import { toVar } from './others'
import { size } from './size'

/** @remarks Defaults to 2.75rem, overridable via --fics-tap-size. */
export const tapSize = (): string => toVar({ name: 'tap-size', value: size(11) })
