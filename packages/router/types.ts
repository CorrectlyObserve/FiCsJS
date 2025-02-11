import type {
  Css,
  Descendant,
  GlobalCssContent,
  OptionArgs,
  Props,
  Sanitized,
  SingleOrArray,
  Syntaxes
} from '../core/types'

export interface FiCsRouter<D extends RouterData, P extends object> {
  props?: Props<D, P>[]
  pages: (PageContent<D, P> & { path: string })[]
  notFound?: PageContent<D, P>
  css?: SingleOrArray<Exclude<Css<D, P>, GlobalCssContent>>
  options?: OptionArgs
}

export interface PageContent<D extends object, P extends object> {
  content: (syntaxes: Syntaxes<D, P>) => Descendant | Sanitized<D, P>
  redirect?: string
}

export type Param = 'path' | 'query'

export interface RouterData {
  pathname: string
  lang: string
}
