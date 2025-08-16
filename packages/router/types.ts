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

export interface FiCsRouter<D extends { pathname: string }> {
  children?: Descendant[]
  data?: () => Omit<D, 'pathname'>
  pathname?: string
  props?: SingleOrArray<Props<D, {}>>
  className?: ClassName<D, {}>
  attributes?: Attrs<D, {}>
  pages: Page<D>[]
  notFound?: PageContent<D>
  css?: SingleOrArray<CssContent<D, {}> | string>
  options?: OptionParams
}

export interface Page<D extends object> extends PageContent<D> {
  path: string
}

export interface PageContent<D extends object> {
  content?: Content<D, {}>
  redirect?: string
}

export type ParamType = 'dynamicPaths' | 'queries'
