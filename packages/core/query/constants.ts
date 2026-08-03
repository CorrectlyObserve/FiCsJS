export const GC_LIMIT_MS = 300_000 as const

export const hash = {
  CIRCULAR: '~',
  DATE: 'D',
  FALSE: 'F',
  MAP: 'M',
  NULL: 'N',
  SET: 'S',
  TRUE: 'T',
  UNDEFINED: 'U'
} as const

export const STALE_MS = 60_000 as const
