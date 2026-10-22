import { COMPACT_SIZE, DISABLED_CSS, EXPANDED_SIZE, GLOBAL_STYLE_ATTR } from './constants'

const addedCss: Set<string> = new Set(),
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
  styleSheet: CSSStyleSheet | undefined

export const getDocumentCss = (): string =>
  `
    ${CSS_LAYER} {
      ${HOST_SELECTOR}{display:block}
      ${layoutCss(`:root,${HOST_SELECTOR}`)}${DISABLED_CSS}
    }
      
    ${[...addedCss].join('')}
    ${configuredCss}
  `

export const addGlobalCss = (css: string): void => {
  if (addedCss.has(css)) return

  addedCss.add(css)
  refresh()
}

export const configGlobalCss = (css: string): void => {
  configuredCss = css
  refresh()
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
