import { cssObject, DISABLED_SELECTOR, ficsCssVar } from './../helpers'

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

export const SCOPE_SELECTOR = ':scope' as const

export const SR_ONLY = cssObject({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  'clip-path': 'inset(50%)',
  'white-space': 'nowrap',
  border: 0
} as const)

export const SR_ONLY_ATTR = 'data-fics-sr-only' as const

/** @remarks Shows hidden elements on focus (e.g., for skip links). */
export const SR_ONLY_CSS = `[${SR_ONLY_ATTR}]:not(:focus-within){${SR_ONLY}}` as const
