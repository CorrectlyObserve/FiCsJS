import type { Axis, Direction, Flex } from './types'

const justifyCenter = { justifyContent: 'center' } as const,
  alignCenter = { alignItems: 'center' } as const

function flexCenter(axis: 'x', direction?: Direction): Readonly<Flex & typeof justifyCenter>
function flexCenter(axis: 'y', direction?: Direction): Readonly<Flex & typeof alignCenter>
function flexCenter(
  axis: 'xy',
  direction?: Direction
): Readonly<Flex & typeof justifyCenter & typeof alignCenter>
function flexCenter(axis: Axis, direction: Direction = 'row'): Readonly<Flex> {
  return {
    display: 'flex',
    flexDirection: direction,
    ...(axis.includes('x') ? justifyCenter : {}),
    ...(axis.includes('y') ? alignCenter : {})
  }
}

export default flexCenter
