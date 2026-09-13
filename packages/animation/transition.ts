import { cssObject } from '../core/helpers'
import type { Direction, TransitionMode } from './types'

const style = (
    transition: string,
    mode: TransitionMode,
    options?: { prop: string; shown: string | number; hidden: string | number }
  ) => {
    const base = { opacity: 1, transition: `${transition.trim()} allow-discrete` } as const
    if (!options) return cssObject(base)

    const hiddenStyle = { opacity: 0, [options.prop]: options.hidden } as const
    return cssObject({
      ...base,
      [options.prop]: options.shown,
      ...(mode.startsWith('in') && { '@starting-style': hiddenStyle }),
      ...(mode.endsWith('out') && { '&[style*="display: none"]': hiddenStyle })
    })
  },
  hiddenStyle = (distance: string) =>
    ({
      top: `0 -${distance}`,
      bottom: `0 ${distance}`,
      left: `-${distance} 0`,
      right: `${distance} 0`
    }) as const

export const fade = (transition: string, mode: TransitionMode = 'in-out') => style(transition, mode)

export const float = ({
  transition,
  mode,
  distance,
  direction
}: {
  transition: string
  mode?: TransitionMode
  distance?: string
  direction: Direction
}) =>
  style(transition, mode ?? 'in-out', {
    prop: 'translate',
    shown: '0 0',
    hidden: hiddenStyle(distance ?? '1rem')[direction]
  })

export const slide = ({
  transition,
  mode,
  direction
}: {
  transition: string
  mode?: TransitionMode
  direction: Direction
}) =>
  style(transition, mode ?? 'in-out', {
    prop: 'translate',
    shown: '0 0',
    hidden: hiddenStyle('100%')[direction]
  })

export const zoom = (transition: string, mode: TransitionMode = 'in-out') =>
  style(transition, mode, { prop: 'scale', shown: 1, hidden: 0.95 })
