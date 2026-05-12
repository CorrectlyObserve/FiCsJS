import consts from '../constants'
import { isBlankString } from '../helpers'
import type { Template } from '../types'
import templateConstants from './constants'

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
  const varBegin: string = `<${consts.VAR_TAG_NAME} ${consts.attrs.FICS_ID}="`,
    varBeginIndex: number = html.indexOf(varBegin)

  if (varBeginIndex < 0) return html

  const varEnd: string = `"></${consts.VAR_TAG_NAME}>`,
    varEndIndex: number = html.indexOf(varEnd, varBeginIndex + varBegin.length)

  if (varEndIndex < 0) return html

  const prev: string = html.slice(0, varBeginIndex),
    instanceId: string = resolveInstanceId(
      html.slice(varBeginIndex + varBegin.length, varEndIndex)
    ),
    next: string = resolveDescendants({
      html: html.slice(varEndIndex + varEnd.length),
      resolveInstanceId
    })

  return `${prev}${instanceId}${next}`
}

export const applyShowAttr = ({ html, resolveInstanceId }: Template.ForSsr): string => {

  while (showAttrIndex > -1) {
    const openIndex: number = html.lastIndexOf(LEFT_ANGLE_BRACKET, showAttrIndex),
      closeIndex: number = html.indexOf(RIGHT_ANGLE_BRACKET, showAttrIndex)

    if (openIndex < 0 || closeIndex < 0 || html[openIndex + 1] === '/') break

    let tag: string = html.slice(openIndex, closeIndex + 1).replace(showAttr, '')
    const match: RegExpMatchArray | null = tag.match(regExp.STYLE)

    if (match) {
      const [, quote, style]: string[] = match
      tag = tag.replace(regExp.STYLE, ` style=${quote}${setDisplayNone(style)}${quote}`)
    } else tag = tag.replace(regExp.TAG_END, ` style="${DISPLAY_NONE}"$1`)

    html = `${html.slice(0, openIndex)}${tag}${html.slice(closeIndex + 1)}`
    showAttrIndex = html.indexOf(consts.attrs.SHOW, openIndex + tag.length)
  }

  return resolveDescendants({ html, resolveInstanceId })
}
