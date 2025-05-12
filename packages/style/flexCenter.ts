type Direction = 'row' | 'column'

interface Flex {
  display: 'flex'
  flexDirection: Direction
}

const justifyCenter = { justifyContent: 'center' } as const
const alignCenter = { alignItems: 'center' } as const

export function flexCenter(axis: 'x', direction?: Direction): Flex & typeof justifyCenter
export function flexCenter(axis: 'y', direction?: Direction): Flex & typeof alignCenter
export function flexCenter(
  axis: 'xy',
  direction?: Direction
): Flex & typeof justifyCenter & typeof alignCenter
export function flexCenter(axis: 'xy' | 'x' | 'y', direction: Direction = 'row'): Flex {
  return {
    display: 'flex',
    flexDirection: direction,
    ...(axis.includes('x') ? justifyCenter : {}),
    ...(axis.includes('y') ? alignCenter : {})
  }
}
