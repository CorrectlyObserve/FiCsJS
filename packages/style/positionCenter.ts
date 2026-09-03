import { cssDeclarations } from '../core/helpers'
import type { Axis, Center, Position } from './types'

const horizontal = { left: '50%' } as const,
  vertical = { top: '50%' } as const

export function positionCenter(axis: 'x', position?: Position): Readonly<Center & typeof horizontal>
export function positionCenter(axis: 'y', position?: Position): Readonly<Center & typeof vertical>
export function positionCenter(
  axis: 'xy',
  position?: Position
): Readonly<Center & typeof horizontal & typeof vertical>
export function positionCenter(axis: Axis, position?: Position): Readonly<Center>
export function positionCenter(axis: Axis, position: Position = 'absolute'): Readonly<Center> {
  switch (axis) {
    case 'x':
      return cssDeclarations({ position, ...horizontal, transform: 'translateX(-50%)' } as const)

    case 'y':
      return cssDeclarations({ position, ...vertical, transform: 'translateY(-50%)' } as const)

    case 'xy':
      return cssDeclarations({
        position,
        ...horizontal,
        ...vertical,
        transform: 'translate(-50%, -50%)'
      } as const)
  }
}
