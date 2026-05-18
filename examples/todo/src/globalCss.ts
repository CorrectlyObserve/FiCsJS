import { calc, cssVar, size, textSize } from 'ficsjs/style'
import { breakpoints, white } from '@/utils/others'

const outline = `${cssVar('outline')} solid ${white()}` as const

export default {
  '*': { padding: 0, margin: 0, boxSizing: 'border-box' },
  'h2, p, button, label, legend, input, textarea, span': { color: white() },
  'h2, p, button': { textAlign: 'center' },
  'p, label, legend, input, textarea': textSize('base'),
  'button, input, textarea': {
    transition: cssVar('transition'),
    background: 'none',
    border: 'none',
    outline: 'none',
    borderRadius: size(2),
    '&:not([disabled])': {
      '&:hover': { background: white(0.1), cursor: 'pointer' },
      '&:focus, &:focus-visible': { outline }
    }
  },
  h2: {
    ...textSize('xl'),
    marginBlockEnd: size(8),
    [`@media (max-width: ${breakpoints.SM})`]: { marginBlockEnd: size(6) }
  },
  'label:hover': { cursor: 'pointer' },
  'input, textarea': {
    minWidth: '20rem',
    maxWidth: size(120 - 16),
    paddingBlock: size(3),
    paddingInline: size(4),
    border: `${calc(`${size(1)} / 4`)} solid ${white()}`
  },
  a: {
    transition: cssVar('transition'),
    borderRadius: size(2),
    '&:hover': { background: white(0.1), cursor: 'pointer' },
    '&:focus, &:focus-visible': { color: 'inherit', outline, outlineOffset: 0 },
    '&:active': { scale: 0.98 }
  },
  'span[role="button"]': { padding: size(4) }
}
