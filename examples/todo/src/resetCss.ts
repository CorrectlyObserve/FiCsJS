export default [
  { selector: '*', style: { padding: 0, margin: 0, boxSizing: 'border-box' } },
  { selector: ['h1', 'h2'], style: { textAlign: 'center', lineHeight: 1.5 } },
  { selector: 'h1', style: { fontSize: 'var(--lg)' } },
  {
    selector: 'h2',
    style: { fontSize: 'calc(var(--md) * 1.5)', color: '#fff', marginBottom: 'var(--lg)' }
  },
  {
    selector: ['p', 'button'],
    style: { fontSize: 'var(--md)', color: '#fff', textAlign: 'center', lineHeight: 1 }
  },
  { selector: ['button', 'a'], style: { cursor: 'pointer' } },
  {
    selector: 'button',
    style: { transition: 'var(--transition)', border: 'none', outline: 'none' },
    nested: [
      { selector: ':hover', style: { opacity: 0.5 } },
      { selector: ':focus', style: { transform: 'scale(0.8)' } }
    ]
  },
  { selector: ['span', 'a'], style: { color: 'inherit', lineHeight: 'inherit' } },
  {
    selector: 'a',
    style: { width: '100%', display: 'inline-block', textDecoration: 'none' }
  }
]
