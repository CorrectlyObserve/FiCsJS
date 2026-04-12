import type { Axis, Center, Position } from './types'

const horizontal = { left: '50%' } as const,
  vertical = { top: '50%' } as const

function positionCenter(axis: 'x', position?: Position): Readonly<Center & typeof horizontal>
function positionCenter(axis: 'y', position?: Position): Readonly<Center & typeof vertical>
function positionCenter(
  axis: 'xy',
  position?: Position
): Readonly<Center & typeof horizontal & typeof vertical>
function positionCenter(axis: Axis, position: Position = 'absolute'): Readonly<Center> {
  switch (axis) {
    case 'x':
      return { position, ...horizontal, transform: 'translateX(-50%)' }

    case 'y':
      return { position, ...vertical, transform: 'translateY(-50%)' }

    case 'xy':
      return { position, ...horizontal, ...vertical, transform: 'translate(-50%, -50%)' }
  }
}

export default positionCenter
