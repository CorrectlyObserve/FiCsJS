type Position = 'absolute' | 'fixed'

interface Center {
  position: Position
  transform: 'translate(-50%, -50%)' | 'translateX(-50%)' | 'translateY(-50%)'
}

const horizontal = { left: '50%' } as const
const vertical = { top: '50%' } as const

export function absoluteCenter(axis: 'x', position?: Position): Center & typeof horizontal
export function absoluteCenter(axis: 'y', position?: Position): Center & typeof vertical
export function absoluteCenter(
  axis: 'xy',
  position?: Position
): Center & typeof horizontal & typeof vertical
export function absoluteCenter(axis: 'xy' | 'x' | 'y', position: Position = 'absolute'): Center {
  switch (axis) {
    case 'x':
      return { position, ...horizontal, transform: 'translateX(-50%)' }

    case 'y':
      return { position, ...vertical, transform: 'translateY(-50%)' }

    case 'xy':
      return { position, ...horizontal, ...vertical, transform: 'translate(-50%, -50%)' }
  }
}
