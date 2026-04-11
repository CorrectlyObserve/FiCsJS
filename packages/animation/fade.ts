import type { TransitionMode } from './types'

export default (transition: string, mode: TransitionMode = 'in-out') =>
  ({
    opacity: 1,
    transition: `${transition.trim()} allow-discrete`,
    '@starting-style': mode.startsWith('in') ? { opacity: 0 } : {},
    '&[style*="display: none"]': mode.endsWith('out') ? { opacity: 0 } : {}
  }) as const
