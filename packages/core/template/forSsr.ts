import { attrs, VAR_TAG_NAME } from '../constants'
import { escapeRegExp, isBlankString } from '../helpers'
import type { Template } from '../types'
import { constants as templateConstants } from './constants'

const {
    char: { LEFT_ANGLE_BRACKET, RIGHT_ANGLE_BRACKET },
    DISPLAY_NONE,
    regExp
  } = templateConstants,
  setDisplayNone = (style: string): string => {
    if (regExp.DISPLAY.test(style))
      return style.replace(
        regExp.DISPLAY,
        (_match: string, prefix: string, spacing: string) => `${prefix}${spacing}${DISPLAY_NONE}`
      )

    const trimmed: string = style.trim()
    return `${isBlankString(trimmed) ? '' : `${trimmed}${trimmed.endsWith(';') ? '' : ';'} `}${DISPLAY_NONE}`
  }

const resolveDescendants = ({ html, resolveInstanceId }: Template.ForSsr): string => {
  const varBegin: string = `<${VAR_TAG_NAME} ${attrs.FICS_ID}="`,
    varEnd: string = `"></${VAR_TAG_NAME}>`
}

export const applyShowAttr = ({ html, resolveInstanceId }: Template.ForSsr): string => {
  let showAttrIndex: number = html.indexOf(attrs.SHOW)

  while (showAttrIndex > -1) {
    const openIndex: number = html.lastIndexOf(char.LEFT_ANGLE_BRACKET, showAttrIndex),
      closeIndex: number = html.indexOf(char.RIGHT_ANGLE_BRACKET, showAttrIndex)

    if (openIndex < 0 || closeIndex < 0 || html[openIndex + 1] === '/') break

    let tag: string = html.slice(openIndex, closeIndex + 1).replace(showAttr, '')
    const match: RegExpMatchArray | null = tag.match(regExp.STYLE)

    if (match) {
      const [, quote, style]: string[] = match
      tag = tag.replace(regExp.STYLE, ` style=${quote}${setDisplayNone(style)}${quote}`)
    } else tag = tag.replace(regExp.TAG_END, ` style="${DISPLAY_NONE}"$1`)

    html = `${html.slice(0, openIndex)}${tag}${html.slice(closeIndex + 1)}`
    showAttrIndex = html.indexOf(constants.attrs.SHOW, openIndex + tag.length)
  }

  return resolveDescendants({ html, resolveInstanceId })
}
