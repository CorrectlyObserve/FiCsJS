import { DISABLED_SELECTOR, ficsCssVar } from './../helpers'

export const AT_RULE = '@' as const,
  BACKSLASH = '\\' as const

export const BRACKET_PAIRS = { '(': ')', '{': '}' } as const,
  COMMENT_TOKEN = { open: '/*', close: '*/' } as const

export const COMPACT_SIZE = '40rem' as const

export const DISABLED_CSS =
  `:is(${DISABLED_SELECTOR}){${ficsCssVar('disabled')}:70%;cursor:not-allowed}` as const

export const EXPANDED_SIZE = '64rem' as const,
  GLOBAL_STYLE_ATTR = 'data-fics-global' as const

export const HOST_CONTEXT_SELECTOR = ':host-context' as const

export const IGNORE_TOKENS = [COMMENT_TOKEN, { open: 'url(', close: ')' }] as const
