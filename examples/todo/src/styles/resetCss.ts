export default [
  { selector: '*', style: { padding: 0, margin: 0, boxSizing: 'border-box' } },
  { selector: ['h1', 'h2'], style: { textAlign: 'center' } },
  { selector: 'h2', style: { marginBottom: 'var(--lg)' } },
  { selector: ['h2', 'p', 'button'], style: { color: '#fff', textAlign: 'center' } },
  { selector: ['p', 'button'], style: { fontSize: 'var(--md)', lineHeight: '100%' } },
  { selector: 'button', style: { border: 0, cursor: 'pointer' } },
  { selector: 'span', style: { color: 'inherit', lineHeight: '100%' } },
  {
    selector: 'a',
    style: {
      width: '100%',
      display: 'inline-block',
      color: 'inherit',
      cursor: 'pointer',
      textDecoration: 'none'
    }
  }
]
