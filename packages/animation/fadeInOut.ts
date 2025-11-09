export default (transition: string) =>
  ({
    opacity: 1,
    transition: `${transition.trim()} allow-discrete`,
    '@starting-style': { opacity: 0 },
    '&[style*="display: none"]': { opacity: 0 }
  }) as const
