export const LANG_LIST = ['en', 'ja'] as const

export type Lang = (typeof LANG_LIST)[number]
