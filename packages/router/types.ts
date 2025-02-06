import type { CssArgs, Descendant, OptionArgs, Props, Sanitized, Syntaxes } from '../core/types'

export interface FiCsRouter<D extends RouterData, P extends object> {
  data?: () => Omit<D, keyof RouterData>
  props?: Props<D, P>[]
  pages: (PageContent<D, P> & { path: string })[]
  notFound?: PageContent<D, P>
  css?: CssArgs<D, P>
  options?: OptionArgs
}

export interface PageContent<D extends object, P extends object> {
  content: (syntaxes: Syntaxes<D, P> & { data: D }) => Descendant | Sanitized<D, P>
  redirect?: string
}

export type Param = 'path' | 'query'

export interface RouterData {
  pathname: string
  lang: string
  pathParams: Record<string, string>
  queryParams: Record<string, string>
}
