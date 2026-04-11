export default (transition: string, type: 'in' | 'out' | 'in-out' = 'in-out') =>
  ({
    opacity: 1,
    transition: `${transition.trim()} allow-discrete`,
    '@starting-style': type.startsWith('in') ? { opacity: 0 } : {},
    '&[style*="display: none"]': type.endsWith('out') ? { opacity: 0 } : {}
  }) as const
