import type { Descendant, Options, Props, Sanitized, SingleOrArray, Syntaxes } from '../core/types'

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
  pathParams: Record<string, string>
  queryParams: Record<string, string>
}
