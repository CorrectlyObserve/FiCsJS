import { SR_ONLY_ATTR } from './css'
import type { Attr } from './types'

type BaseA11y = typeof baseA11y

const baseA11y = {
  ariaHidden: [['aria-hidden', 'true']],
  liveLog: [
    ['role', 'log'],
    ['aria-live', 'polite']
  ],
  liveStatus: [
    ['aria-live', 'polite'],
    ['role', 'status'],
    ['aria-atomic', 'true']
  ],
  srOnly: [[SR_ONLY_ATTR, '']]
} as const

export const a11y = Object.fromEntries(
  Object.entries(baseA11y).map(([attrKey, entries]) => [
    attrKey,
    entries.map(([key, value]) => (value === '' ? key : `${key}="${value}"`)).join(' ')
  ])
) as { [K in keyof BaseA11y]: Attr.Stringified<BaseA11y[K]> }

export const a11yAttrs = Object.fromEntries(
  Object.entries(baseA11y).map(([key, entries]) => [key, Object.fromEntries(entries)])
) as { [K in keyof BaseA11y]: { [E in BaseA11y[K][number] as E[0]]: E[1] } }

export const a11ySelectors = Object.fromEntries(
  Object.entries(baseA11y).map(([key, entries]) => [
    key,
    entries.map(([key, value]) => (value === '' ? `[${key}]` : `[${key}="${value}"]`)).join(' ')
  ])
) as { [K in keyof BaseA11y]: string }
