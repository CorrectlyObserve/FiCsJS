import type { TransitionMode } from './types'

export default (transition: string, type: TransitionMode = 'in-out') =>
  ({
    opacity: 1,
    transition: `${transition.trim()} allow-discrete`,
    '@starting-style': type.startsWith('in') ? { opacity: 0 } : {},
    '&[style*="display: none"]': type.endsWith('out') ? { opacity: 0 } : {}
  }) as const
