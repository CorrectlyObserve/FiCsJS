const consts = {
  CONTROL_CHAR: /[\u0000-\u001F\u007F-\u009F]/u,
  INVALID_ATTR_FRAGMENT: /["'<>\/=`]/,
  INVALID_UNQUOTED_ATTR_VALUE: /["'<>`]/
} as const

const isValidAttrName = (attr: string): boolean =>
    attr.length > 0 && !consts.CONTROL_CHAR.test(attr) && !/[\s"'<>\/=`]/u.test(attr),
  isSpace = (char: string): boolean =>
    char === ' ' || char === '\t' || char === '\n' || char === '\f' || char === '\r'
