import { calc, cssVar } from 'ficsjs/style'
import { breakpoints, white } from '@/utils/others'

const hover = { cursor: 'pointer', opacity: 0.5 } as const,
  outline = `${cssVar('outline')} solid ${white()}`

export default {
  '*': { padding: 0, margin: 0, boxSizing: 'border-box' },
  '*[tabindex], label': {
    '&:hover': hover,
    '&:focus': { color: cssVar('red'), outline: 'none' }
  },
  'h2, p, button, label, input, textarea, span': { color: white() },
  'h2, p, button': { textAlign: 'center' },
  'p, button, label, input, textarea': { fontSize: cssVar('md') },
  'p, button, label': { lineHeight: 1.2 },
  'button, input, textarea': {
    transition: cssVar('transition'),
    border: 'none',
    outline: 'none',
    borderRadius: cssVar('xs'),
    '&:not([disabled]):hover': { cursor: 'pointer' }
  },
  h2: {
    fontSize: cssVar('lg'),
    lineHeight: 1.5,
    marginBottom: cssVar('xl'),
    [`@media (max-width: ${breakpoints.sm})`]: { marginBottom: cssVar('lg') }
  },
  button: {
    '&[disabled]': { background: 'none', color: white(0.2), cursor: 'not-allowed' },
    '&:not([disabled])': { '&:focus, &:focus-visible': { outline } }
  },
  label: { display: 'inline-block', textAlign: 'left', '&:hover': hover },
  'input, textarea': {
    minWidth: calc(`${cssVar('md')} * 20`),
    maxWidth: calc('-', calc(`${cssVar('md')} * 30`), calc(`${cssVar('xl')} * 2`)),
    paddingInline: cssVar('md'),
    lineHeight: 1.5,
    '&:focus': { background: white(0.8), color: cssVar('black'), cursor: 'auto' }
  },
  a: {
    transition: cssVar('transition'),
    borderRadius: cssVar('xs'),
    '&:hover': { background: white(0.1), cursor: 'pointer' },
    '&:focus, &:focus-visible': { color: 'inherit', outline, outlineOffset: 0 }
  },
  span: { '&[role="button"]': { padding: cssVar('md') } }
}
