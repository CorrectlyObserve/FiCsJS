import { cssObject } from '../core/helpers'
import type { Direction, TransitionMode } from './types'

const style = (
    transition: string,
    mode: TransitionMode,
    options?: { prop: string; shown: string | number; hidden: string | number }
  ) => {
    const applyStyle = (type: 'shown' | 'hidden') => options && { [options.prop]: options[type] }
    return cssObject({
      opacity: 1,
      transition: `${transition.trim()} allow-discrete`,
      ...applyStyle('shown'),
      ...(mode.startsWith('in') && { '@starting-style': applyStyle('hidden') }),
      ...(mode.endsWith('out') && { '&[style*="display: none"]': applyStyle('hidden') })
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
