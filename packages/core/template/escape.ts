import consts from './constants'

const {
    char: { DOUBLE_QUOTE, LEFT_ANGLE_BRACKET, RIGHT_ANGLE_BRACKET, SINGLE_QUOTE }
  } = consts,
  quotePattern: RegExp = new RegExp(`[${DOUBLE_QUOTE}${SINGLE_QUOTE}]`, 'g')

export default (str: string, context: 'attr' | 'text-content' = 'attr'): string => {
  const escapedTextContent: string = str.replace(
    /[&<>]/g,
    char =>
      ({
        '&': '&amp;',
        [LEFT_ANGLE_BRACKET]: '&lt;',
        [RIGHT_ANGLE_BRACKET]: '&gt;'
      })[char] as string
  )

  if (context === 'text-content') return escapedTextContent

  return escapedTextContent.replace(
    quotePattern,
    char => ({ [DOUBLE_QUOTE]: '&quot;', [SINGLE_QUOTE]: '&#39;' })[char] as string
  )
}
