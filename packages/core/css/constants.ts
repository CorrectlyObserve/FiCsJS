export const AT_RULE = '@' as const
export const BACKSLASH = '\\' as const

export const BRACKET_PAIRS = { '(': ')', '{': '}' } as const
export const COMMENT_TOKEN = { open: '/*', close: '*/' } as const

export const GROUPING_AT_RULES = [
  '@container',
  '@layer',
  '@media',
  '@scope',
  '@starting-style',
  '@supports'
] as const

export const HOST_CONTEXT_SELECTOR = ':host-context' as const

export const IGNORE_TOKENS = [
  { open: '/*', close: '*/' },
  { open: 'url(', close: ')' }
] as const
