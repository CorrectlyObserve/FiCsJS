import { char as c } from '../helpers'

export const char = {
  ...c,
  COMMENT_OPEN_TAG: '<!--',
  COMMENT_CLOSE_TAG: '-->',
  EQUAL_SIGN: '=',
  HYPHEN: '-',
  LEFT_ANGLE_BRACKET: '<',
  RIGHT_ANGLE_BRACKET: '>'
} as const

export const regExp = {
  CONTROL_CHAR: /[\u0000-\u001F\u007F-\u009F]/u,
  INVALID_ATTR_FRAGMENT: /["'<>\/=`]/,
  INVALID_UNQUOTED_ATTR_VALUE: /["'<>`]/
} as const
