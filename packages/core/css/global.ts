import { CSS_LAYER, HOST_SELECTOR } from '../helpers'

const addedCss: Set<string> = new Set()
let configuredCss: string = '',
  styleSheet: CSSStyleSheet | undefined,
  isStale: boolean = true

export const addGlobalCss = (css: string): void => {
  if (addedCss.has(css)) return

  addedCss.add(css)
  isStale = true
}

export const configGlobalCss = (css: string): void => {
  configuredCss = css
  isStale = true
}

export const getGlobalCss = (): string => `${[...addedCss].join('')}${configuredCss}`

export const getGlobalStyleSheet = (): CSSStyleSheet => {
  styleSheet ??= new CSSStyleSheet()

  if (isStale) {
    styleSheet.replaceSync(`${CSS_LAYER}{${HOST_SELECTOR}{display:block}}${getGlobalCss()}`)
    isStale = false
  }

  return styleSheet
}
