export const attrs = { FICS_ID: 'fics-id', SHOW: 'fics-show-syntax' } as const

export const a11y = {
  STATUS_LIVE_REGION: 'role="status" aria-live="polite" aria-atomic="true"'
} as const

export const BOOLEAN_ATTRS: ReadonlySet<string> = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'shadowrootclonable',
  'shadowrootdelegatesfocus',
  'shadowrootserializable',
  'selected'
])

/** @remarks The maximum capacity of 1 byte (8 bits), which is a power of 2 */
export const CLONED_SELVES_LENGTH = 256 as const

export const hostSelector = {
  ITSELF: ':host',
  GROUP: ':host\\(([^()]*(?:\\([^()]*\\))*[^()]*)\\)',
  STRICT: ':host(?!-)'
} as const

export const symbols = {
  SANITIZED: Symbol('fics-sanitized-template'),
  UNSAFE_HTML: Symbol('fics-unsafe-html')
} as const

export const VAR_TAG_NAME = 'f-_var' as const
