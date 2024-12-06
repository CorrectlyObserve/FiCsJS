import FiCsElement from '../core/class'
import type {
  CssContent,
  Descendant,
  Options,
  Props,
  Sanitized,
  SingleOrArray,
  Syntaxes
} from '../core/types'

export interface FiCsLink<P extends object> {
  href: string
  content: (syntaxes: Syntaxes<{}, P>) => Descendant | Sanitized<{}, P>
  router: FiCsElement<RouterData, P>
  props?: SingleOrArray<Props<{}, P>>
  css?: SingleOrArray<string | CssContent<{}, P>>
  options?: { ssr?: boolean }
}

export interface FiCsRouter<P extends object> {
  pages: (PageContent<P> & { path: string })[]
  notFound?: PageContent<P>
  props?: SingleOrArray<Props<RouterData, P>>
  options?: Omit<Options, 'immutable'>
}

export interface PageContent<P extends object> {
  content: (syntaxes: Syntaxes<RouterData, P>) => Descendant | Sanitized<RouterData, P>
  redirect?: string
}

export interface RouterData {
  pathname: string
  lang: string
}
