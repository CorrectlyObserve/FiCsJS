import type {
  Action,
  Attrs,
  ClassName,
  CssContent,
  DataProps,
  Descendant,
  Html,
  Hooks,
  OptionsCtx,
  Props,
  SingleOrArray
} from '../core/types'

export type Content<D extends object, P extends object> = (
  syntaxes: Omit<DataProps<D, P>, 'props'> & Html.Syntaxes<D, P>
) => Returned<D, P>

export interface FiCsLink<P extends object> {
  children?: Descendant[]
  props?: SingleOrArray<Props<{}, P>>
  className?: ClassName<{}, P>
  attributes?: Attrs<{}, P>
  href: (({ props }: { props: P }) => string) | string
  content: Content<{}, P>
  css?: SingleOrArray<CssContent<{}, P> | string>
  actions?: Action.Handlers<{}, P>
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
  hooks?: Hooks<RouterData<D>, {}>
  options?: OptionsCtx<RouterData<D>, {}>
}

export interface Page<D extends object> extends PageContent<D> {
  path: string
}

export interface PageContent<D extends object> {
  content?: Content<RouterData<D>, {}>
  redirect?: string
}

export type ParamType = 'dynamicPaths' | 'queries'

export type Returned<D extends object, P extends object> = Descendant | Html.Sanitized<D, P>

export type RouterData<D extends object> = D & {
  pathname: string
  queries: Record<string, string>
}
