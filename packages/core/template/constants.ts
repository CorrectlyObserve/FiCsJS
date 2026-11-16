import { char as c } from '../helpers'

export const char = {
  ...c,
  COMMENT_OPEN_TAG: '<!--',
  COMMENT_CLOSE_TAG: '-->',
  EQUAL_SIGN: '=',
  LEFT_ANGLE_BRACKET: '<',
  RIGHT_ANGLE_BRACKET: '>'
} as const

export const DISPLAY_NONE = 'display:none;' as const

export const regExp = {
  ATTR: (attr: string) => new RegExp(`(?:\\s+)${attr}(?=(\\s|>|/))`, 'g'),
  CONTROL_CHAR: /[\u0000-\u001F\u007F-\u009F]/u,
  DISPLAY: /(^|;)(\s*)display\s*:[^;]*(?=;|$)/i,

  INVALID_ATTR_FRAGMENT: /["'<>\/=`]/,
  INVALID_UNQUOTED_ATTR_VALUE: /["'<>`]/,
  STYLE: /\sstyle\s*=\s*(["'])([\s\S]*?)\1/i,
  TAG_END: /(\s*\/?>)$/
} as const
