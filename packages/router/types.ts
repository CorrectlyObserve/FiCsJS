import type {
  Actions,
  Attrs,
  ClassName,
  CssContent,
  Children,
  DataPropsMethods,
  Descendant,
  OptionParams,
  Props,
  Sanitized,
  SingleOrArray,
  Syntaxes
} from '../core/types'

export type Content<D extends object, P extends object> = (
  syntaxes: Omit<DataPropsMethods<D, P>, 'props' | 'getData'> &
    Syntaxes<D, P> & { children: Children }
) => Descendant | Sanitized<D, P>

export interface FiCsLink<P extends object> {
  children?: Descendant[]
  href: string
  props?: SingleOrArray<Props<{}, P>>
  className?: ClassName<{}, P>
  attributes?: Attrs<{}, P>
  content: Content<{}, P>
  css?: SingleOrArray<CssContent<{}, P> | string>
  actions?: Actions<{}, P>
}

export interface FiCsRouter<D extends { pathname: string; lang: string }, P extends object> {
  children?: Descendant[]
  pathname?: string
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  pages: (PageContent<D, P> & { path: string })[]
  notFound?: PageContent<D, P>
  css?: SingleOrArray<CssContent<D, P> | string>
  options?: OptionParams
}

export interface PageContent<D extends object, P extends object> {
  content: Content<D, P>
  redirect?: string
}

export type Param = 'dynamicPaths' | 'queries'
