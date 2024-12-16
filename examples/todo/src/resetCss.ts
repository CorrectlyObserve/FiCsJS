export default [
  { selector: '*', style: { padding: 0, margin: 0, boxSizing: 'border-box' } },
  { selector: ['h1', 'h2'], style: { textAlign: 'center', lineHeight: 1.5 } },
  { selector: 'h1', style: { fontSize: 'var(--ex-lg)' } },
  {
    selector: 'h2',
    style: { fontSize: 'calc(var(--md) * 1.5)', color: '#fff', marginBottom: 'var(--ex-lg)' }
  },
  {
    selector: ['p', 'button', 'li', 'span'],
    style: { fontSize: 'var(--lg)', color: '#fff' },
    nested: [
      { selector: ':is(li)', style: { lineHeight: 1.8 } },
      { selector: ':not(li)', style: { textAlign: 'center', lineHeight: 1 } }
    ]
  },
  {
    selector: 'button',
    style: { transition: 'var(--transition)', cursor: 'pointer', border: 'none', outline: 'none' },
    nested: [
      { selector: ':hover', style: { opacity: 0.5 } },
      { selector: ':focus', style: { transform: 'scale(0.8)' } }
    ]
  },
  {
    selector: ['input', 'textarea'],
    style: { background: 'rgba(255, 255, 255, 0.1)' },
    nested: [
      { selector: ':hover', style: { cursor: 'pointer' } },
      { selector: ':focus', style: { cursor: 'auto', background: 'rgba(255, 255, 255, 0.8)' } }
    ]
  },
  {
    selector: 'input',
    style: {
      width: 'calc(var(--md) * 20)',
      fontSize: 'var(--lg)',
      color: 'var(--black)',
      padding: 'var(--ex-sm) var(--md)',
      borderRadius: 'var(--ex-sm)',
      border: 'none',
      outline: 'none'
    }
  },
  {
    selector: 'a',
    style: {
      width: '100%',
      display: 'inline-block',
      color: 'inherit',
      cursor: 'pointer',
      lineHeight: 'inherit',
      textDecoration: 'none'
    }
  }
]
