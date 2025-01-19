import { color, calc, scale, variable } from 'ficsjs/style'
import breakpoints from '@/breakpoints'

export default {
  '*': { padding: 0, margin: 0, boxSizing: 'border-box' },
  '*[tabindex], button, label, a': { transition: variable('transition') },
  '*[tabindex]:hover, a:hover': { cursor: 'pointer', opacity: 0.5 },
  '*[tabindex]:focus, a:focus': { color: variable('red'), outline: 'none' },
  'h1, h2': { textAlign: 'center', lineHeight: 1.5 },
  h2: {
    fontSize: variable('xl'),
    color: '#fff',
    marginBottom: variable('2xl'),
    [`@media (max-width: ${breakpoints.sm})`]: { marginBottom: variable('xl') }
  },
  'p, button, label, span': {
    fontSize: variable('lg'),
    color: '#fff',
    '&:not(label)': { textAlign: 'center', lineHeight: 1 }
  },
  button: {
    border: 'none',
    outline: 'none',
    '&[aria-disabled="true"]': { cursor: 'not-allowed' },
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
  'input, textarea': {
    width: calc([variable('md'), 20], '*'),
    background: color('#fff', 0.1),
    fontSize: variable('lg'),
    color: '#fff',
    padding: `${variable('xs')} ${variable('md')}`,
    borderRadius: variable('xs'),
    border: 'none',
    outline: 'none',
    '&:hover': { cursor: 'pointer' },
    '&:focus': { background: color('#fff', 0.8), color: variable('black'), cursor: 'auto' }
  },
  span: { width: 'fit-content' },
  a: {
    width: '100%',
    display: 'inline-block',
    color: 'inherit',
    lineHeight: 'inherit',
    textDecoration: 'none',
    outline: 'none'
  }
}
