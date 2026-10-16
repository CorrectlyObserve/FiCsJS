import { toVar } from './others'
import { size } from './size'

export const tapSize = (): string => toVar({ name: 'tap-size', value: size(11) })
