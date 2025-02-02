import type { CssArgs, Descendant, OptionArgs, Props, Sanitized, Syntaxes } from '../core/types'

export interface FiCsRouter<P extends object> {
  pages: (PageContent<P> & { path: string })[]
  notFound?: PageContent<P>
  props?: Props<RouterData, P>[]
  css?: CssArgs<RouterData, P>
  options?: OptionArgs
}

export interface PageContent<P extends object> {
  content: (syntaxes: Syntaxes<RouterData, P>) => Descendant | Sanitized<RouterData, P>
  redirect?: string
}

export type Param = 'path' | 'query'

export interface RouterData {
  pathname: string
  lang: string
}
