import type { Axis, Center, Position } from './types'

const horizontal = { left: '50%' } as const,
  vertical = { top: '50%' } as const

export function absoluteCenter(axis: 'x', position?: Position): Readonly<Center & typeof horizontal>
export function absoluteCenter(axis: 'y', position?: Position): Readonly<Center & typeof vertical>
export function absoluteCenter(
  axis: 'xy',
  position?: Position
): Readonly<Center & typeof horizontal & typeof vertical>
export function absoluteCenter(axis: Axis, position: Position = 'absolute'): Readonly<Center> {
  switch (axis) {
    case 'x':
      return { position, ...horizontal, transform: 'translateX(-50%)' }

    case 'y':
      return { position, ...vertical, transform: 'translateY(-50%)' }

    case 'xy':
      return { position, ...horizontal, ...vertical, transform: 'translate(-50%, -50%)' }
  }
}
