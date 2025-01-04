import { color, calc, scale, variable } from 'ficsjs/css'

export default [
  {
    selector: ['*[tabindex]', 'button', 'label', 'a'],
    style: { transition: variable('transition') }
  },
  {
    selector: '*',
    style: { padding: 0, margin: 0, boxSizing: 'border-box' },
    nested: {
      selector: '[tabindex]',
      style: {},
      nested: [
        { selector: ':hover', style: { cursor: 'pointer', opacity: 0.5 } },
        { selector: ':focus', style: { color: variable('red'), outline: 'none' } }
      ]
    }
  },
  { selector: ['h1', 'h2'], style: { textAlign: 'center', lineHeight: 1.5 } },
  { selector: 'h1', style: { fontSize: variable('ex-lg') } },
  {
    selector: 'h2',
    style: {
      fontSize: calc([variable('md'), 1.5], '*'),
      color: '#fff',
      marginBottom: variable('ex-lg')
    }
  },
  {
    selector: ['p', 'button', 'li', 'label', 'span'],
    style: { fontSize: variable('lg'), color: '#fff' },
    nested: [
      { selector: ':is(li)', style: { lineHeight: 1.8 } },
      {
        selector: ':is(label)',
        style: { display: 'inline-block' },
        nested: { selector: ':hover', style: { cursor: 'pointer', opacity: 0.5 } }
      },
      { selector: ':not(li, label)', style: { textAlign: 'center', lineHeight: 1 } },
      { selector: ':is(span)', style: { width: 'fit-content' } }
    ]
  },
  {
    selector: 'button',
    style: { border: 'none', outline: 'none' },
    nested: [
      {
        selector: ':not([aria-disabled="true"])',
        style: {},
        nested: [
          { selector: ':hover', style: { cursor: 'pointer', opacity: 0.5 } },
          { selector: ':focus', style: { transform: scale(0.8) } }
        ]
      },
      { selector: '[aria-disabled="true"]', style: { cursor: 'not-allowed' } }
    ]
  },
  {
    selector: ['input', 'textarea'],
    style: {
      width: calc([variable('md'), 20], '*'),
      background: color('#fff', 0.1),
      fontSize: variable('lg'),
      color: '#fff',
      padding: `${variable('ex-sm')} ${variable('md')}`,
      borderRadius: variable('ex-sm'),
      border: 'none',
      outline: 'none'
    },
    nested: [
      { selector: ':hover', style: { cursor: 'pointer' } },
      {
        selector: ':focus',
        style: {
          background: color('#fff', 0.8),
          color: variable('black'),
          cursor: 'auto'
        }
      }
    ]
  },
  {
    selector: 'textarea',
    style: {
      height: calc([calc([variable('ex-sm'), 2], '*'), calc([variable('lg'), 1.2, 6], '*')], '+'),
      lineHeight: 1.2,
      resize: 'none'
    }
  },
  {
    selector: 'a',
    style: {
      width: '100%',
      display: 'inline-block',
      color: 'inherit',
      lineHeight: 'inherit',
      textDecoration: 'none',
      outline: 'none'
    },
    nested: [
      { selector: ':hover', style: { cursor: 'pointer' } },
      { selector: ':focus', style: { opacity: 0.5 } }
    ]
  }
]
