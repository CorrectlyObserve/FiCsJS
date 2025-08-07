import { calc, cssVar, oklch } from 'ficsjs/style'
import { breakpoints, white } from '@/utils'

const hover = { cursor: 'pointer', opacity: 0.5 } as const

export default {
  '*': { padding: 0, margin: 0, boxSizing: 'border-box' },
  '*[tabindex], button, label, a': {
    transition: cssVar('transition'),
    '&:not(button)': { '&:hover': hover, '&:focus': { color: cssVar('red'), outline: 'none' } }
  },
  'h2, p, button, label, span': { color: white, textAlign: 'center' },
  h2: {
    fontSize: cssVar('lg'),
    marginBottom: cssVar('xl'),
    lineHeight: 1.5,
    [`@media (max-width: ${breakpoints.sm})`]: { marginBottom: cssVar('lg') }
  },
  'p, button, label, span': { fontSize: cssVar('md'), lineHeight: 1.2 },
  button: {
    border: 'none',
    outline: 'none',
    '&:not([aria-disabled="true"])': { '&:hover': hover, '&:focus': { scale: 0.8 } }
  },
  label: { display: 'inline-block', textAlign: 'left', '&:hover': hover },
  'input, textarea': {
    minWidth: calc([cssVar('md'), 20], '*'),
    fontSize: cssVar('md'),
    color: white,
    paddingInline: cssVar('md'),
    borderRadius: cssVar('xs'),
    border: 'none',
    outline: 'none',
    lineHeight: 1.5,
    '&:hover': { cursor: 'pointer' },
    '&:focus': {
      background: oklch(white, { opacity: 0.8 }),
      color: cssVar('black'),
      cursor: 'auto'
    }
  },
  span: { width: 'fit-content' }
}
