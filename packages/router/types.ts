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

export interface FiCsRouter<D extends object> {
  children?: Descendant[]
  data?: () => D
  pathname?: string
  props?: SingleOrArray<Props<RouterData<D>, {}>>
  className?: ClassName<RouterData<D>, {}>
  attributes?: Attrs<RouterData<D>, {}>
  pages: Page<D>[]
  notFound?: PageContent<D>
  css?: SingleOrArray<CssContent<RouterData<D>, {}> | string>
  options?: OptionParams
}

export interface Page<D extends object> extends PageContent<D> {
  path: string
}

export interface PageContent<D extends object> {
  content?: Content<RouterData<D>, {}>
  redirect?: string
}

export type ParamType = 'dynamicPaths' | 'queries'

export type RouterData<D extends object> = D & {
  pathname: string
  queries: Record<string, string>
}