interface Absolute {
  position: 'absolute'
  top: '50%'
  transform: 'translate(-50%, -50%)' | 'translateY(-50%)'
}

export function absoluteCenter(axis?: 'y'): Absolute
export function absoluteCenter(axis?: 'xy'): Absolute & { left: '50%' }
export function absoluteCenter(axis: 'xy' | 'y' = 'xy'): Absolute {
  return {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    ...(axis === 'xy' ? { left: '50%' } : { transform: 'translateY(-50%)' })
  }
}
