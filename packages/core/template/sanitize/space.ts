export const isSpace = (char: string): boolean =>
  char === ' ' || char === '\t' || char === '\n' || char === '\f' || char === '\r'

export const skipSpace = (fragment: string, index: number): number => {
  while (index < fragment.length && isSpace(fragment[index])) index++
  return index
}
