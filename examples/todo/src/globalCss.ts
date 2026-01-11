import { calc, cssVar } from 'ficsjs/style'
import { breakpoints, white } from '@/utils/others'

const outline = `${cssVar('outline')} solid ${white()}` as const

export default {
  '*': {
    padding: 0,
    margin: 0,
    boxSizing: 'border-box',
    '&[tabindex], &:is(a)': {
      transition: cssVar('transition'),
      borderRadius: cssVar('xs'),
      '&:hover': { background: white(0.1), cursor: 'pointer' },
      '&:focus, &:focus-visible': { outline },
      '&:active': { scale: 0.98 }
    },
    '&:is(a)': { '&:focus, &:focus-visible': { color: 'inherit', outlineOffset: 0 } }
  },
  'h2, p, button, label, legend, input, textarea, span': { color: white() },
  'h2, p, button': { textAlign: 'center' },
  'p, button, label, legend, input, textarea': { fontSize: cssVar('md') },
  'p, button, legend, label': { lineHeight: 1.2 },
  'button, input, textarea': {
    transition: cssVar('transition'),
    background: 'none',
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
    paddingBlock: cssVar('md'),
    '&[disabled]': { background: 'none !important', color: white(0.2), cursor: 'not-allowed' },
    '&:not([disabled])': { '&:focus, &:focus-visible': { outline }, '&:active': { scale: 0.95 } }
  },
  'label:hover': { cursor: 'pointer' },
  'input, textarea': {
    minWidth: calc(`${cssVar('md')} * 20`),
    maxWidth: calc('-', calc(`${cssVar('md')} * 30`), calc(`${cssVar('xl')} * 2`)),
    padding: `${calc(`${cssVar('xs')} * 1.5`)} ${cssVar('md')}`,
    lineHeight: 1.5,
    border: `1px solid ${white()}`,
    '&:hover': { background: white(0.1) },
    '&:focus': { outline, outlineColor: cssVar('pink') }
  },
  'span[role="button"]': { padding: cssVar('md') }
}
