import { cssDeclarations } from '../core/helpers'

export const forScreenReaders = cssDeclarations({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  'clip-path': 'inset(50%)',
  'white-space': 'nowrap',
  border: 0
} as const)
