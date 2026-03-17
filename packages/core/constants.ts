const HOST_SELECTOR = ':host' as const

export default {
  a11y: { STATUS_LIVE_REGION: 'role="status" aria-live="polite" aria-atomic="true"' },
  BOOLEAN_ATTRS: new Set([
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
  ]),
  /** @remarks The maximum capacity of 1 byte (8 bits), which is a power of 2 */
  CLONED_SELVES_LENGTH: 256,
  FICS_ID_ATTR: 'fics-id',
  hostSelector: {
    ITSELF: HOST_SELECTOR,
    GROUP: `${HOST_SELECTOR}\\(([^()]*(?:\\([^()]*\\))*[^()]*)\\)`,
    STRICT: `${HOST_SELECTOR}(?!-)`
  },
  symbols: {
    SANITIZED: Symbol('fics-sanitized-template'),
    UNSAFE_HTML: Symbol('fics-unsafe-html')
  },
  VAR_TAG_NAME: 'f-var'
} as const
