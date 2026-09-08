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
import { denialCodes, RESERVED_ROUTER_DATA_KEYS, RPC_MODULE_TYPE, statusCodes } from './constants'

export type Content<D extends object, P extends object, T = {}> = (
  syntaxes: Omit<DataProps.Payload<D, P>, 'props'> & Html.Syntaxes<D, P> & T
) => Returned<D, P>

export interface FiCsLink<P extends object> {
  name?: string
  children?: Descendant[]
  props?: SingleOrArray<Props<{}, P>>
  className?: ClassName<{}, P>
  attributes?: Attrs<{}, P>
  anchorAttributes?: WithoutHref<Attrs<{}, P>>
  href: (({ props }: { props: Readonly<P> }) => string) | string
  content: Content<{}, P>
  css?: Css.Ctx<{}, P>
  actions?: Action.Handlers<{}, P>
}

export interface FiCsRouter<D extends object> {
  children?: Descendant[]
  data?: () => D &
    ([OverlappedKeys<D>] extends [never]
      ? unknown
      : {
          [K in OverlappedKeys<D>]: `Please rename data key "${K & string}" as it is reserved by the router...`
        })
  pathname?: string
  meta?: Record<string, string>
  props?: SingleOrArray<Props<RouterData<D>, {}>>
  className?: ClassName<RouterData<D>, {}>
  attributes?: Attrs<RouterData<D>, {}>
  css?: Css.Ctx<RouterData<D>, {}>
  hooks?: Hook.Lifecycle<RouterData<D>, {}>
  options?: Options.Ctx<RouterData<D>, {}>
}

type OverlappedKeys<D> = Extract<keyof D, keyof typeof RESERVED_ROUTER_DATA_KEYS>

export interface Page<D extends object = Record<string, unknown>> extends PageContent<D> {
  path: string
}

export interface PageContent<D extends object = Record<string, unknown>> {
  content?: Content<RouterData<D>, {}>
  redirect?: string
  meta?: Routing.Meta
}

export type ParamType = 'dynamicPaths' | 'queries'

export type Returned<D extends object, P extends object> = Descendant | Html.Sanitized<D, P>

export type RouterData<D extends object> = D & {
  pathname: Readonly<string>
  queries: Readonly<Record<string, string>>
  status: Routing.Status.Resolved
}

export declare namespace Routing {
  namespace Build {
    interface Ctx extends RouteManifest, Layout, Middleware, Spa, Special {}

    interface Layout {
      clientLayouts: (string | null)[]
      serverLayouts: (string | null)[]
      uniqueLayouts: string[]
      layoutAlias: Map<string, string>
    }

    interface Middleware {
      middlewares: string[][]
      uniqueMiddlewares: string[]
      middlewareAlias: Map<string, string>
    }

    interface Query extends RouteManifest {
      filePaths: string[]
      extensions: Extensions
    }

    interface Spa {
      dirs: string[]
      files: Map<string, string>
      spaAlias: Map<string, string>
      /** @remarks Parallel array for routes */
      spaOwners: (string | null)[]
      /** @remarks Parallel array for routes */
      areSpaEntry: boolean[]
    }

    interface Special {
      rootStatusFiles: Status.RootFiles
      inheritedStatusKeys: Map<string, Set<string>>
      statusFallback: { src: string; serverSrc: string | null } | null
      redirect: string | null
      statusFiles: Map<string, Map<string, string>>
      aliases: Map<string, Map<string, string>>
    }
  }

  type ClientEntries = { name: string; src: string; spaRouter?: string }[]

  interface Config {
    dir?: string
    output?: string
    pageFile?: string
    extensions?: Extensions
    /** @remarks The URL prefix of the RPC client. Defaults to '/_rpc'. */
    basePath?: string
    entries?: boolean
  }

  interface Denial {
    code: Status.DenialCode
    redirect?: string
  }

  type Extensions = Readonly<string[]>

  type Meta =
    | Record<string, string>
    | ((ctx: { status: Status.Resolved }) => Record<string, string>)

  type Middleware<C = Record<string, unknown>> = (ctx: MiddlewareCtx<C>) => Awaitable<void | Denial>

  type MiddlewareCtx<C = Record<string, unknown>> = C & {
    req: Request
    dynamicParams: Record<string, string>
    deny: (ctx?: Partial<Denial>) => Denial
    signal?: AbortSignal
  }

  interface Module {
    default?: unknown
    redirect?: string
    meta?: Meta
  }

  namespace Options {
    interface Assemble {
      ctx: Build.Ctx
      baseDir: string
      rpc: Rpc.Generated | null
    }

    interface Files<T> {
      filePaths: string[]
      extensions: Extensions
      expectedType: T
    }

    interface Generate {
      filePaths: string[]
      options?: {
        baseDir?: string
        pageFile?: string
        extensions?: Extensions
      }
      basePath?: string
    }

    interface InternalPageHost<C = Record<string, unknown>> extends PageHost<C> {
      scriptBase: string
    }

    interface PageHost<C = Record<string, unknown>> {
      render: (ctx: Render) => string
      createContext?: (req: Request) => Awaitable<C>
      scriptBase?: string
      meta?: Record<string, string>
    }

    interface PageManifest<C = Record<string, unknown>> extends Status.Manifest<C> {
      routes: { path: string; page: ServerModule<C>; entry: string; layout?: Module }[]
      middlewares?: Readonly<Record<string, readonly Middleware<C>[]>>
      /** @remarks Server-only. Rewrites arbitrary inbound URLs that the client SPA never sees before routing. */
      redirects?: ((pathname: string) => string | null) | Record<string, string>
    }
  }

  type Redirects = ((pathname: string) => string | null) | Map<string, string>

  interface Render {
    meta: Record<string, string>
    content: string
    path: string
    script: string
    styles: string
  }

  interface ResolvedRoute<C = Record<string, unknown>> {
    module: ServerModule<C>
    entry: string
    path: string
    middlewares: readonly Middleware<C>[]
  }

  interface ResolvedSpec<D extends object = Record<string, unknown>> {
    pages: Page<D>[]
    statusModules: Record<string, PageContent<D> | undefined>
    statusFallback?: PageContent<D>
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
    serverSpecifier: string | null
  }

  interface RouteManifest {
    routes: RouteEntry[]
  }

  type RpcEntries = { dirs: string[]; specifier: string }[]

  interface ServerModule<C = Record<string, unknown>> {
    default?: (
      ctx: MiddlewareCtx<C> & { error?: unknown; status: Status.Resolved }
    ) => Awaitable<string>
    meta?: Meta
  }

  interface Spec {
    routes: Route<Module>[]
    statusModules?: Record<string, Module>
    statusFallback?: Module
    inheritedStatusKeys?: string[]
    redirects?: Record<string, string>
  }

  namespace Status {
    type Code = Table[Name]

    type DenialCode = (typeof denialCodes)[keyof typeof denialCodes]

    interface Event {
      code: PageCode
      isHandled: boolean
    }

    interface Manifest<C = Record<string, unknown>> {
      statusPages: Pages<C>
      statusFallback?: Page<C>
    }

    type Name = keyof Table

    interface Page<C = Record<string, unknown>> {
      module: ServerModule<C>
      entry: string
    }

    type PageCode = Table[keyof typeof denialCodes | 'INTERNAL_SERVER_ERROR']

    type Pages<C = Record<string, unknown>> = Partial<Record<PageCode, Page<C>>>

    type Resolved = PageCode | Table['OK']

    type RootFiles = {
      prop: string
      path: string
      src: string
      serverSrc: string | null
    }[]

    type Table = typeof statusCodes
  }
}

export declare namespace Rpc {
  type Ctx<C = unknown> = {
    req: Request
    signal: AbortSignal
    dynamicParams: Record<string, string>
  } & C

  interface ErrorInit<T extends Routing.Status.Name | TransportCode = Routing.Status.Name> {
    code: T
    message: string
    denied?: boolean
    expose?: boolean
    redirect?: string
  }

  interface Generated {
    client: { imports: string[]; code: string }
    server: { imports: string[]; code: string }
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
      idempotent?: boolean
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
    input?: (raw?: Record<string, unknown>) => Awaitable<I>
    handler: (input: I, ctx: Ctx<C>) => Awaitable<O>
  }

  interface ResolvedProcedure<C = unknown> {
    procedure: Procedure<unknown, unknown, C>
    middlewares: readonly Routing.Middleware<C>[]
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

  type TransportCode = 'ABORTED' | 'NETWORK' | 'TIMEOUT'

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

export type WithoutHref<T> = T extends (ctx: infer C) => infer R
  ? (ctx: C) => WithoutHref<R>
  : T & { href?: 'Pass the "href" option as a top-level option, not inside "anchorAttributes"...' }

export declare namespace Vite {
  interface DevServer {
    watcher: { add: (path: string) => void }
    middlewares: {
      use: (
        handler: (
          req: { url?: string; originalUrl?: string },
          /** @remarks Keeps `number` as it mirrors Node's `ServerResponse`. */
          res: {
            statusCode: number
            setHeader: (key: string, value: string) => void
            end: (body: string) => void
          },
          next: (err?: unknown) => void
        ) => void
      ) => void
    }
    transformIndexHtml: (url: string, html: string, originalUrl?: string) => Promise<string>
  }

  interface Plugin {
    name: string
    enforce: 'pre'
    config: () => {
      resolve: { alias: Record<string, string> }
      build?: { rollupOptions: { input: string } }
    }
    configResolved: (config: { root: string; build: { outDir: string } }) => void
    configureServer: (server: DevServer) => () => void
    buildStart: () => void
    transform: (
      code: string,
      id: string
    ) => {
      code: string
      /** @remarks No source map — the transformation only prepends one line. */
      map: null
    } | null
    writeBundle: () => void
    handleHotUpdate: ({ file }: { file: string }) => void
  }
}
