import { cssObject } from '../core/helpers'
import type { Axis } from './types'

export const flex = ({
  inline,
  direction,
  center,
  gap
}: {
  inline?: boolean
  direction?: 'column' | 'row'
  center?: Axis
  gap?: string
} = {}) =>
  cssObject({
    display: `${inline ? 'inline-' : ''}flex`,
    ...(direction && { 'flex-direction': direction ?? 'row' }),
    ...(center?.includes('x') && { 'justify-content': 'center' }),
    ...(center?.includes('y') && { 'align-items': 'center' }),
    ...(gap && { gap })
  } as const)
