interface Absolute {
  position: 'absolute'
  top: '50%'
}

export function absoluteCenter(axis?: 'y'): Absolute & { transform: 'translateY(-50%)' }
export function absoluteCenter(
  axis?: 'xy'
): Absolute & { left: '50%'; transform: 'translate(-50%, -50%)' }
export function absoluteCenter(axis: 'xy' | 'y' = 'xy') {
  const absolute: Absolute = { position: 'absolute', top: '50%' }

  if (axis === 'y') return { ...absolute, transform: 'translateY(-50%)' }
  return { ...absolute, left: '50%', transform: 'translate(-50%, -50%)' }
}
