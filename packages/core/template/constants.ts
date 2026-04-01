export default {
  char: {
    COMMENT_OPEN_TAG: '<!--',
    COMMENT_CLOSE_TAG: '-->',
    DOUBLE_QUOTE: '"',
    LEFT_ANGLE_BRACKET: '<',
    RIGHT_ANGLE_BRACKET: '>',
    SINGLE_QUOTE: "'"
  },
  DISPLAY_NONE: 'display:none;',
  regExp: {
    ATTR: (attr: string) => new RegExp(`(?:\\s+)${attr}(?=(\\s|>|/))`, 'g'),
    CONTROL_CHAR: /[\u0000-\u001F\u007F-\u009F]/u,
    DISPLAY: /(^|;)(\s*)display\s*:[^;]*(?=;|$)/i,

    INVALID_ATTR_FRAGMENT: /["'<>\/=`]/,
    INVALID_UNQUOTED_ATTR_VALUE: /["'<>`]/,
    SPECIAL_CHAR: /[.*+?^${}()|[\]\\]/g,
    STYLE: /\sstyle\s*=\s*(["'])([\s\S]*?)\1/i,
    TAG_END: /(\s*\/?>)$/
  }
} as const
