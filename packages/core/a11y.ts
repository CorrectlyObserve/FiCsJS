import { SR_ONLY_ATTR } from './css'
import type { Attr } from './types'

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
    entries.map(([key, value]) => `${key}="${value}"`).join(' ')
  ])
) as {
  [K in keyof typeof baseA11y]: Attr.Stringified<(typeof baseA11y)[K]>
}

export const a11yAttrs = Object.fromEntries(
  Object.entries(baseA11y).map(([key, entries]) => [key, Object.fromEntries(entries)])
) as {
  [K in keyof typeof baseA11y]: { [E in (typeof baseA11y)[K][number] as E[0]]: E[1] }
}
