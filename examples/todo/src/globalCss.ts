import { calc, cssVar } from 'ficsjs/style'
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
    borderRadius: cssVar('xs'),
    '&:not([disabled])': {
      '&:hover': { background: white(0.1), cursor: 'pointer' },
      '&:focus, &:focus-visible': { outline }
    }
  },
  h2: {
    fontSize: cssVar('lg'),
    lineHeight: 1.5,
    marginBlockEnd: cssVar('xl'),
    [`@media (max-width: ${breakpoints.sm})`]: { marginBlockEnd: cssVar('lg') }
  },
  'label:hover': { cursor: 'pointer' },
  'input, textarea': {
    minWidth: calc(`${cssVar('md')} * 20`),
    maxWidth: calc('-', calc(`${cssVar('md')} * 30`), calc(`${cssVar('xl')} * 2`)),
    paddingBlock: calc(`${cssVar('xs')} * 1.5`),
    paddingInline: cssVar('md'),
    lineHeight: 1.5,
    border: `1px solid ${white()}`
  },
  a: {
    transition: cssVar('transition'),
    borderRadius: cssVar('xs'),
    '&:hover': { background: white(0.1), cursor: 'pointer' },
    '&:focus, &:focus-visible': { color: 'inherit', outline, outlineOffset: 0 },
    '&:active': { scale: 0.98 }
  },
  'span[role="button"]': { padding: cssVar('md') }
}
