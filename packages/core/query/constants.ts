export const GC_LIMIT_MS = 300_000 as const

export const hash = {
  CIRCULAR: '~',
  DATE: 'D',
  FALSE: 'F',
  MAP: 'M',
  NULL: 'N',
  REGEXP: 'R',
  SET: 'S',
  TRUE: 'T',
  UNDEFINED: 'U'
} as const

export const NEEDS_ESCAPE: RegExp = /["\\]/

export const STALE_MS = 60_000 as const
