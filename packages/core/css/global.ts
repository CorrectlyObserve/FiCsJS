import { CSS_LAYER, ficsCssVar, HOST_SELECTOR, isBrowser } from '../helpers'
import {
  COMPACT_SIZE,
  DISABLED_CSS,
  EXPANDED_SIZE,
  GLOBAL_STYLE_ATTR,
  SR_ONLY_CSS
} from './constants'

const addedCss: Set<string> = new Set(),
  layoutCss = (selector: string): string =>
    [
      [`width < ${COMPACT_SIZE}`, 'compact'],
      [`${COMPACT_SIZE} <= width < ${EXPANDED_SIZE}`, 'regular'],
      [`width >= ${EXPANDED_SIZE}`, 'expanded']
    ]
      .map(([query, scale]) => `@media (${query}){${selector}{${ficsCssVar('layout')}:${scale}}}`)
      .join(''),
  refresh = (): void => styleSheet?.replaceSync(getGlobalCss())

let configuredCss: string = '',
  styleSheet: CSSStyleSheet | undefined

export const getGlobalCss = (): string =>
  `
    ${CSS_LAYER} {
      ${HOST_SELECTOR}{display:block}
      ${layoutCss(`:root,${HOST_SELECTOR}`)}${DISABLED_CSS}${SR_ONLY_CSS}
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

export const getGlobalStyleSheet = (): CSSStyleSheet => {
  if (styleSheet) return styleSheet

  styleSheet = new CSSStyleSheet()
  refresh()

  if (isBrowser()) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet]
    document.querySelector(`style[${GLOBAL_STYLE_ATTR}]`)?.remove()
  }

  return styleSheet
}
