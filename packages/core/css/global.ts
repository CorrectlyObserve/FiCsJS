import { ficsCssVar } from './../helpers'
import { CSS_LAYER, HOST_SELECTOR } from '../helpers'
import { COMPACT_SIZE, DISABLED_CSS, EXPANDED_SIZE } from './constants'

const addedCss: Set<string> = new Set(),
  globalCss = (): string => `${[...addedCss].join('')}${configuredCss}`,
  layoutCss = (selector: string): string =>
    [
      [`width < ${COMPACT_SIZE}`, 'compact'],
      [`${COMPACT_SIZE} <= width < ${EXPANDED_SIZE}`, 'regular'],
      [`width >= ${EXPANDED_SIZE}`, 'expanded']
    ]
      .map(([query, scale]) => `@media (${query}){${selector}{${ficsCssVar('layout')}:${scale}}}`)
      .join(''),
  refresh = (): void => styleSheet?.replaceSync(getDocumentCss())

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

export const getDocumentCss = (): string =>
  `${CSS_LAYER}{${layoutCss(':root')}${DISABLED_CSS}}${globalCss()}`

export const getGlobalStyleSheet = (): CSSStyleSheet => {
  styleSheet ??= new CSSStyleSheet()

  if (isStale) {
    styleSheet.replaceSync(
      `${CSS_LAYER}{${HOST_SELECTOR}{display:block}${layoutCss(HOST_SELECTOR)}${DISABLED_CSS}}${globalCss()}`
    )
    isStale = false
  }

  return styleSheet
}
