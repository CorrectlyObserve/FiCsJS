import { scale, variable } from 'ficsjs/style'
import breakpoints from '@/breakpoints'

export default {
  '*': { padding: 0, margin: 0, boxSizing: 'border-box' },
  '*[tabindex], button, label, a': { transition: variable('transition') },
  '*[tabindex]:hover, a:hover': { cursor: 'pointer', opacity: 0.5 },
  '*[tabindex]:focus, a:focus': { color: variable('red'), outline: 'none' },
  'h2, p, button, label, span': { color: '#fff', textAlign: 'center' },
  h2: {
    fontSize: variable('xl'),
    marginBottom: variable('2xl'),
    lineHeight: 1.5,
    [`@media (max-width: ${breakpoints.sm})`]: { marginBottom: variable('xl') }
  },
  'p, button, label, span': { fontSize: variable('md'), lineHeight: 1.2 },
  button: {
    border: 'none',
    outline: 'none',
    '&:not([aria-disabled="true"])': {
      '&:hover': { cursor: 'pointer', opacity: 0.5 },
      '&:focus': { transform: scale(0.8) }
    }
  },
  label: {
    display: 'inline-block',
    textAlign: 'left',
    '&:hover': { cursor: 'pointer', opacity: 0.5 }
  },
  span: { width: 'fit-content' }
}
