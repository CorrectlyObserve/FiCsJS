import type {
  Attrs,
  ClassName,
  Css,
  Children,
  Descendant,
  GlobalCssContent,
  OptionParams,
  Props,
  Sanitized,
  SingleOrArray,
  Syntaxes
} from '../core/types'

export interface FiCsRouter<D extends RouterData, P extends object> {
  children?: Descendant[]
  pathname?: string
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  pages: (PageContent<D, P> & { path: string })[]
  notFound?: PageContent<D, P>
  css?: SingleOrArray<Exclude<Css<D, P>, GlobalCssContent>>
  options?: OptionParams
}

export interface PageContent<D extends object, P extends object> {
  content: (syntaxes: Syntaxes<D, P> & { children: Children }) => Descendant | Sanitized<D, P>
  redirect?: string
}

export type Param = 'dynamicPaths' | 'queries'

export interface RouterData {
  pathname: string
  lang: string
}

export interface RoutingOptions {
  withHistory?: boolean
  reload?: boolean
}