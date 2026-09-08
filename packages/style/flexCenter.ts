import { cssDeclarations } from '../core/helpers'
import type { Axis, Flex, FlexOptions } from './types'

const justifyCenter = { 'justify-content': 'center' } as const,
  alignCenter = { 'align-items': 'center' } as const

export function flexCenter(axis: 'x', options?: FlexOptions): Readonly<Flex & typeof justifyCenter>
export function flexCenter(axis: 'y', options?: FlexOptions): Readonly<Flex & typeof alignCenter>

export function flexCenter(
  axis: 'xy',
  options?: FlexOptions
): Readonly<Flex & typeof justifyCenter & typeof alignCenter>

export function flexCenter(axis: Axis, options?: FlexOptions): Readonly<Flex> {
  return cssDeclarations({
    display: `${options?.inline ? 'inline-' : ''}flex`,
    'flex-direction': options?.direction ?? 'row',
    ...(axis.includes('x') && justifyCenter),
    ...(axis.includes('y') && alignCenter)
  } as const)
}
