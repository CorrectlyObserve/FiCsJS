import { color, calc, scale, variable } from 'ficsjs/css'

export default {
  '*': { padding: 0, margin: 0, boxSizing: 'border-box' },
  '*[tabindex], button, label, a': { transition: variable('transition') },
  '*[tabindex]:hover, a:hover': { cursor: 'pointer', opacity: 0.5 },
  '*[tabindex]:focus, a:focus': { color: variable('red'), outline: 'none' },
  'h1, h2': { textAlign: 'center', lineHeight: 1.5 },
  h2: {
    fontSize: calc([variable('md'), 1.5], '*'),
    color: '#fff',
    marginBottom: variable('ex-lg')
  },
  'p, button, label, span': {
    fontSize: variable('lg'),
    color: '#fff',
    ':not(label)': { textAlign: 'center', lineHeight: 1 }
  },
  button: {
    border: 'none',
    outline: 'none',
    ':not([aria-disabled="true"])': {
      '&:hover': { cursor: 'pointer', opacity: 0.5 },
      '&:focus': { transform: scale(0.8) }
    },
    '[aria-disabled="true"]': { cursor: 'not-allowed' }
  },
  label: { display: 'inline-block', '&:hover': { cursor: 'pointer', opacity: 0.5 } },
  'input, textarea': {
    width: calc([variable('md'), 20], '*'),
    background: color('#fff', 0.1),
    fontSize: variable('lg'),
    color: '#fff',
    padding: `${variable('ex-sm')} ${variable('md')}`,
    borderRadius: variable('ex-sm'),
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
