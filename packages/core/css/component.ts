export const toComponentCss = ({
  css,
  host,
  warnMisuse
}: {
  css: string
  host?: string
  warnMisuse: (text: string) => void
}): string => {
  const rules: string = dropBareDeclarations(css, warnMisuse)
  return host ? `@scope (${host}) to (${attrs.FICS_ID}) {${toScope(rules)}}` : rules
}
