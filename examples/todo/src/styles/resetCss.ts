export default [
  { selector: '*', style: { padding: 0, margin: 0, boxSizing: 'border-box' } },
  { selector: ['h1', 'h2', 'p', 'button'], style: { textAlign: 'center' } },
  { selector: 'h2', style: { marginBottom: 'var(--lg)' } },
  { selector: ['h2', 'p', 'button'], style: { color: '#fff' } },
  { selector: ['p', 'button'], style: { fontSize: 'var(--md)' } },
  { selector: ['p', 'button', 'span'], style: { lineHeight: '100%' } },
  {
    selector: 'button',
    style: { border: 0, cursor: 'pointer', transition: '0.2s ease-out' },
    nested: [{ selector: '&:hover', style: { opacity: '0.5' } }]
  },
  { selector: ['span', 'a'], style: { color: 'inherit' } },
  {
    selector: 'a',
    style: { width: '100%', display: 'inline-block', cursor: 'pointer', textDecoration: 'none' }
  }
]
