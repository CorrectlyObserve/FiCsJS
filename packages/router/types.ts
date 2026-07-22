import type {
  Action,
  Attrs,
  Awaitable,
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
import { RPC_MODULE_TYPE, statusCodes } from './constants'

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

export type Returned<D extends object, P extends object> = Descendant | Html.Sanitized<D, P>

export type RouterData<D extends object> = D & {
  pathname: string
  queries: Record<string, string>
  isNotFound: boolean
}

export declare namespace Routing {
  interface BuilderQuery {
    routes: RouteEntry[]
    filePaths: string[]
    extensions: Extensions
  }

  interface Config {
    dir?: string
    output?: string
    pageFile?: string
    extensions?: Extensions
    /** @remarks The URL prefix of the RPC client. Defaults to '/_rpc'. */
    basePath?: string
    entries?: boolean
  }

  namespace Ctx {
    interface All extends Layout, Middleware, Spa, Special {
      routes: RouteEntry[]
    }

    interface Layout {
      layouts: (string | null)[]
      uniques: string[]
      layoutAlias: Map<string, string>
    }

    interface Middleware {
      middlewares: string[]
      uniqueMiddlewares: string[]
      middlewareAlias: Map<string, string>
    }

    interface Spa {
      dirs: string[]
      files: Map<string, string>
      spaAlias: Map<string, string>
      configAlias: Map<string, string>
      /** @remarks Parallel array for routes */
      spaOwners: (string | null)[]
      /** @remarks Parallel array for routes */
      areSpaRoot: boolean[]
    }

    interface Special {
      globalStatus: GlobalStatuses
      redirect: string | null
      statuses: Map<string, Map<string, string>>
      aliases: Map<string, Map<string, string>>
    }
  }

  interface Denial {
    code: string
    status?: number
    redirect?: string
  }

  type Extensions = Readonly<string[]>

  interface FilesQuery<T> {
    filePaths: string[]
    extensions: Extensions
    expectedType: T
  }

  type GlobalStatuses = {
    prop: string
    path: string
    src: string
    serverSrc: string | null
  }[]

  interface Host {
    html: (content: string, status?: number) => unknown
    redirect: (url: string, status?: number) => unknown
    req: unknown
  }

  interface Module {
    default?: unknown
    redirect?: string
    meta?: Record<string, string>
  }

  namespace Options {
    interface Generate {
      baseDir?: string
      pageFile?: string
      extensions?: Extensions
    }

    interface Register<C = Record<string, unknown>> {
      render: (ctx: Render) => string
      toHostRoutePath: (path: string) => string
      createContext?: (ctx: Routing.Host) => C
      serverError?: Routing.ServerModule<C>
      notFound?: Routing.ServerModule<C>
      redirects?: Routing.Redirects
    }
  }

  interface Redirect {
    pathname: string
    redirectMap: ReadonlyMap<string, string>
    redirectFn?: RedirectFn
  }

  type RedirectFn = (pathname: string) => string | null

  type Redirects = Record<string, string> | RedirectFn

  interface Render {
    meta: Record<string, string>
    content: string
    path: string
    script: string
  }

  interface Resolved<D extends object = Record<string, unknown>> {
    pages: Page<D>[]
    statusModules: Record<string, PageContent<D> | undefined>
    redirectFn?: RedirectFn
  }

  interface Route<T extends Module> {
    path: string
    page: T
    layout?: T
  }

  interface RouteEntry {
    path: string
    specifier: string
    src: string
  }

  type ServerEntries = {
    dirs: string[]
    specifier: string
  }[]

  interface ServerModule<C = Record<string, unknown>> {
    default?: (ctx: C) => Awaitable<string>
    meta?: Record<string, string>
  }

  interface ServerRoute<C = Record<string, unknown>> {
    path: string
    page: ServerModule<C>
    entry: string
    layout?: Module
  }

  interface ServerStatus<C = Record<string, unknown>> {
    module: ServerModule<C>
    entry: string
  }

  interface Spec {
    routes: Route<Module>[]
    redirects?: Redirects
    statusModules?: Record<string, Module>
  }

  type StatusCode = (typeof statusCodes)[
    | 'FORBIDDEN'
    | 'INTERNAL_SERVER_ERROR'
    | 'NOT_FOUND'
    | 'UNAUTHORIZED']
}

export declare namespace Rpc {
  type Ctx<C = unknown> = {
    req: Request
    signal: AbortSignal
    dynamicParams: Record<string, string>
  } & C

  interface ErrorInit {
    code: string
    message: string
    expose?: boolean
    redirect?: string
  }

  interface Generated {
    client: string
    server: string
  }

  type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

  /** @remarks P = Procedure */
  type Caller<P> = P extends { handler: (input: infer I, ctx: any) => infer O }
    ? (input?: I, options?: Options.Call) => Promise<Awaited<O>>
    : never

  /** @remarks R = Router, SR = Sub Router */
  type Client<R> = (R extends (arg: infer A) => infer SR ? (arg: A) => Client<SR> : unknown) & {
    [K in keyof R]: R[K] extends { handler: (input: any, ctx: any) => any }
      ? Caller<R[K]>
      : Client<R[K]>
  }

  namespace Metric {
    type Event = Payload & typeof RPC_MODULE_TYPE

    type Payload =
      | { type: 'request:start'; path: string; method: Method; attempt: number }
      | {
          type: 'request:success'
          path: string
          method: Method
          attempt: number
          durationMs: number
        }
      | {
          type: 'request:error'
          path: string
          method: Method
          attempt: number
          durationMs: number
          error: unknown
          willRetry: boolean
        }
      | { type: 'handle:start'; path: string; method: Method }
      | { type: 'handle:success'; path: string; method: Method; durationMs: number }
      | {
          type: 'handle:error'
          path: string
          method: Method
          durationMs: number
          error: unknown
          stage: 'validate' | 'handle'
        }
      | { type: 'reject'; path: string; reason: 'not-found' | 'bad-request' | 'payload-too-large' }
  }

  namespace Options {
    interface Call extends Omit<Client, 'onMetric' | 'onDeny'> {
      method?: Method
      signal?: AbortSignal
    }

    interface Client<E = Metric.Event> {
      headers?: HeadersInit
      timeoutMs?: number
      intervalMs?: number
      maxRetries?: number
      onMetric?: (event: E) => void
      onDeny?: (deny: Routing.Denial) => void
    }

    interface Handler<C = unknown, E = Metric.Event> {
      createContext?: (req: Request) => Awaitable<C>
      onError?: (error: unknown, info: { path: string; req: Request }) => void
      onMetric?: (event: E) => void
      maxBodyBytes?: number
    }
  }

  interface Procedure<I = unknown, O = unknown, C = unknown> {
    input?: (raw: unknown) => Awaitable<I>
    handler: (input: I, ctx: Ctx<C>) => Awaitable<O>
  }

  type Serializable<T> = T extends string | number | boolean | null | undefined
    ? T
    : T extends readonly (infer U)[]
      ? readonly Serializable<U>[]
      : T extends (...args: never[]) => unknown
        ? never
        : T extends object
          ? { [K in keyof T]: Serializable<T[K]> }
          : never

  type ValidatedProcedure<I, O, C> = [O] extends [Serializable<O> | void]
    ? Procedure<I, O, C>
    : {
        readonly __rpcError: 'The RPC handler return must be JSON-serializable or void...'
        readonly returned: O
      }
}

export interface TypeNode {
  children: Map<string, TypeNode>
  alias?: string
  dynamic?: { name: string; node: TypeNode }
}

export interface VitePlugin {
  name: string
  enforce: 'pre'
  buildStart: () => void
  configureServer: (server: { watcher: { add: (path: string) => void } }) => void
  handleHotUpdate: ({ file }: { file: string }) => void
  transform: (
    code: string,
    id: string
  ) => {
    code: string
    /** @remarks No source map — the transformation only prepends one line. */
    map: null
  } | null
}
