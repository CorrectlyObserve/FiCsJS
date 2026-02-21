import type {
  Action,
  Attrs,
  ClassName,
  Css,
  DataProps,
  Descendant,
  Html,
  Hook,
  Options,
  Props,
  SingleOrArray
} from '../core/types'

export type Content<D extends object, P extends object> = (
  syntaxes: Omit<DataProps.Payload<D, P>, 'props'> & Html.Syntaxes<D, P>
) => Returned<D, P>

export interface FiCsLink<P extends object> {
  children?: Descendant[]
  props?: SingleOrArray<Props<{}, P>>
  className?: ClassName<{}, P>
  attributes?: Attrs<{}, P>
  href: (({ props }: { props: P }) => string) | string
  content: Content<{}, P>
  css?: SingleOrArray<Css.Rules<{}, P> | string>
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
  css?: SingleOrArray<Css.Rules<RouterData<D>, {}> | string>
  hooks?: Hook.Lifecycle<RouterData<D>, {}>
  options?: Options.Ctx<RouterData<D>, {}>
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
