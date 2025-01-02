export default (variable: string): string =>
  `var(--${variable.startsWith('--') ? variable.slice(2) : variable})`
