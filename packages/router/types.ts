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

export type Content<D extends object, P extends object, T = {}> = (
  syntaxes: Omit<DataProps.Payload<D, P>, 'props'> & Html.Syntaxes<D, P> & T
) => Returned<D, P>

export interface FiCsLink<P extends object> {
  children?: Descendant[]
  props?: SingleOrArray<Props<{}, P>>
  className?: ClassName<{}, P>
  attributes?: Attrs<{}, P>
  href: (({ props }: { props: Readonly<P> }) => string) | string
  content: Content<{}, P>
  css?: Css.Ctx<{}, P>
  actions?: Action.Handlers<{}, P>
}

export interface FiCsRouter<D extends object> {
  children?: Descendant[]
  data?: () => D
  pathname?: string
  props?: SingleOrArray<Props<RouterData<D>, {}>>
  className?: ClassName<RouterData<D>, {}>
  attributes?: Attrs<RouterData<D>, {}>
  css?: Css.Ctx<RouterData<D>, {}>
  hooks?: Hook.Lifecycle<RouterData<D>, {}>
  options?: Options.Ctx<RouterData<D>, {}>
}

export interface Page<D extends object = Record<string, unknown>> extends PageContent<D> {
  path: string
  meta?: Record<string, string>
}

export interface PageContent<D extends object = Record<string, unknown>> {
  content?: Content<RouterData<D>, {}>
  redirect?: string
}

export type ParamType = 'dynamicPaths' | 'queries'

export interface Redirect {
  pathname: string
  redirectMap: ReadonlyMap<string, string>
  redirectFn?: Routing.RedirectFn
}

export type Returned<D extends object, P extends object> = Descendant | Html.Sanitized<D, P>

export type RouterData<D extends object> = D & {
  pathname: string
  queries: Record<string, string>
}

export declare namespace Routing {
  interface Module {
    default?: unknown
    redirect?: string
    meta?: Record<string, string>
  }

  type RedirectFn = (pathname: string) => string | null

  type Redirects = Record<string, string> | RedirectFn

  interface Resolved<D extends object = Record<string, unknown>> {
    pages: Page<D>[]
    statusModules: Record<string, PageContent<D> | undefined>
    redirectFn?: Routing.RedirectFn
  }

  interface Spec {
    routes: { path: string; page: Module; layout?: Module }[]
    redirects?: Redirects
    statusModules?: Record<string, Module>
  }
}
