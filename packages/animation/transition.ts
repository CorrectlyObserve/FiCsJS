import type { TransitionMode } from './types'

const style = (
    transition: string,
    mode: TransitionMode,
    options?: { prop: string; shown: string | number; hidden: string | number }
  ) => {
    const { prop, shown, hidden } = options ?? {}

    return {
      opacity: 1,
      transition: `${transition.trim()} allow-discrete`,
      ...(prop && { [prop]: shown }),
      ...(mode.startsWith('in') && prop
        ? { '@starting-style': { opacity: 0, [prop]: hidden } as const }
        : {}),
      ...(mode.endsWith('out') && prop
        ? { '&[style*="display: none"]': { opacity: 0, [prop]: hidden } as const }
        : {})
    } as const
  },
  hiddenStyle = (distance: string) =>
    ({
      top: `0 -${distance}`,
      bottom: `0 ${distance}`,
      left: `-${distance} 0`,
      right: `${distance} 0`
    }) as const

export const fade = (transition: string, mode: TransitionMode = 'in-out') => style(transition, mode)

export const slide = (
  direction: 'top' | 'bottom' | 'left' | 'right',
  transition: string,
  mode: TransitionMode = 'in-out'
) =>
  style(transition, mode, {
    prop: 'translate',
    shown: '0 0',
    hidden: { top: '0 -100%', bottom: '0 100%', left: '-100% 0', right: '100% 0' }[direction]
  })

export const zoom = (transition: string, mode: TransitionMode = 'in-out') =>
  style(transition, mode, { prop: 'scale', shown: 1, hidden: 0.95 })
