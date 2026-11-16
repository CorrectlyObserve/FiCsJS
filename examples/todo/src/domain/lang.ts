import { createState } from 'ficsjs/state'

export type Lang = (typeof LANG_LIST)[number]

export const LANG_LIST = ['en', 'ja'] as const

export const $lang = createState<Lang>('en', {
  sessionStorage: {
    key: 'lang',
    validate: (value): value is Lang => LANG_LIST.some(lang => lang === value)
  }
})
