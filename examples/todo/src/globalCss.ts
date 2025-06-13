import { variable } from 'ficsjs/style'
import { breakpoints, white } from '@/utils'

const hover = { cursor: 'pointer', opacity: 0.5 }

export default {
  '*': { padding: 0, margin: 0, boxSizing: 'border-box' },
  '*[tabindex], button, label, a': {
    transition: variable('transition'),
    '&:not(button)': { '&:hover': hover, '&:focus': { color: variable('red'), outline: 'none' } }
  },
  'h2, p, button, label, span': { color: white, textAlign: 'center' },
  h2: {
    fontSize: variable('lg'),
    marginBottom: variable('xl'),
    lineHeight: 1.5,
    [`@media (max-width: ${breakpoints.sm})`]: { marginBottom: variable('lg') }
  },
  'p, button, label, span': { fontSize: variable('md'), lineHeight: 1.2 },
  button: {
    border: 'none',
    outline: 'none',
    '&:not([aria-disabled="true"])': { '&:hover': hover, '&:focus': { scale: 0.8 } }
  },
  label: { display: 'inline-block', textAlign: 'left', '&:hover': hover },
  span: { width: 'fit-content' }
}
