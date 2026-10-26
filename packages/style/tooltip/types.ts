export type Placement = 'top' | 'bottom' | 'left' | 'right'

export type Tooltip = {
  anchorName?: string
  placement?: Placement
  /** @remarks `flip` has no arrow, as the arrow cannot turn to the far side with the tooltip. */
  variant?: 'arrow' | 'plain' | 'flip'
}
