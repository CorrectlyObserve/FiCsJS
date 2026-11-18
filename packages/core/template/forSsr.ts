import { attrs, VAR_TAG_NAME } from '../constants'

export const resolveDescendants = ({
  html,
  resolveInstanceId
}: {
  html: string
  resolveInstanceId: (instanceId: string) => string
}): string => {
  const idPrefix: string = `<${VAR_TAG_NAME} ${attrs.FICS_ID}="`,
    idSuffix: string = `"></${VAR_TAG_NAME}>`

  let resolved: string = '',
    searchIndex: number = 0

  while (true) {
    const prefixIndex: number = html.indexOf(idPrefix, searchIndex),
      suffixIndex: number =
        prefixIndex < 0 ? -1 : html.indexOf(idSuffix, prefixIndex + idPrefix.length)

    if (suffixIndex < 0) return searchIndex === 0 ? html : `${resolved}${html.slice(searchIndex)}`

    resolved += `${html.slice(searchIndex, prefixIndex)}${resolveInstanceId(
      html.slice(prefixIndex + idPrefix.length, suffixIndex)
    )}`
    searchIndex = suffixIndex + idSuffix.length
  }
}
