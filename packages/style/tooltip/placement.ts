import { typedFromEntries } from '../../core/helpers'
import { type Placement } from './types'

const config = [
  ['top', 'block-end', '0 0, 100% 0, 50% 100%'],
  ['bottom', 'block-start', '50% 0, 100% 100%, 0 100%'],
  ['left', 'inline-end', '0 0, 100% 50%, 0 100%'],
  ['right', 'inline-start', '100% 0, 100% 100%, 0 50%']
] as const

const PLACEMENTS: Record<Placement, { margin: string; shape: string }> = typedFromEntries(
  config.map(([side, margin, coords]) => [
    side,
    { margin: `margin-${margin}`, shape: `polygon(${coords})` }
  ])
)

export const isBlockPlacement = (placement: Placement) =>
  placement === 'top' || placement === 'bottom'

export const toPlacement = (placement: Placement) => PLACEMENTS[placement]
