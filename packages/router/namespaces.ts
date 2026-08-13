import type {
  Action,
  Attrs,
  Awaitable,
  ClassName as _ClassName,
  Css,
  Descendant,
  Hook,
  Props as _Props,
  Options,
  SingleOrArray
} from '../core/types'
import type {
  Content as _Content,
  FiCsRouter as _FiCsRouter,
  Returned,
  RouterData,
  Routing,
  Rpc
} from './types'

export declare namespace FiCsLink {
  type Actions<P> = Action.Handlers<{}, P> | undefined

  type Attributes<P> = Attrs<{}, P> | undefined

  type Children = Descendant[] | undefined

  type ClassName<P> = _ClassName<{}, P> | undefined

  type Content<P extends object> = _Content<{}, P>

  type Css<P> = Css.Ctx<{}, P> | undefined

  type Href<P> = (({ props }: { props: P }) => string) | string

  type Props<P> = SingleOrArray<_Props<{}, P>> | undefined
}

export declare namespace FiCsRouter {
  type Attributes<D extends object> = Attrs<RouterData<D>, {}> | undefined

  type Children = Descendant[] | undefined

  type ClassName<D extends object> = _ClassName<RouterData<D>, {}> | undefined

  type Css<D extends object> = Css.Ctx<RouterData<D>, {}> | undefined

  type Hooks<D extends object> = Hook.Lifecycle<RouterData<D>, {}> | undefined

  type Layout<D extends object> = _Content<RouterData<D>, {}, { slot: Returned<D, {}> }>

  type Options<D extends object> = Options.Ctx<RouterData<D>, {}> | undefined

  type Page<D extends object> = _Content<RouterData<D>, {}>

  type Props<D extends object> = SingleOrArray<_Props<RouterData<D>, {}>> | undefined

  type Spa<D extends object> = _FiCsRouter<D>

  type SsrLayout<T extends object> = (ctx: { slot: string } & T) => Awaitable<string>
}

export declare namespace FiCsRpc {
  type CallOptions = Rpc.Options.Call

  type Client<R> = Rpc.Client<R>

  type ClientOptions = Rpc.Options.Client<MetricEvent>

  type ErrorInit = Rpc.ErrorInit

  type MetricEvent = Extract<Rpc.Metric.Event, { type: `request:${string}` }>
}

export declare namespace FiCsServerRouter {
  type Middleware<C = Record<string, unknown>> = Routing.Middleware<C>

  type Options<C = Record<string, unknown>> = Routing.Options.PageHost<C>

  type Render = Routing.Render
}

export declare namespace FiCsServerRpc {
  type Ctx<C = unknown> = Rpc.Ctx<C>

  type ErrorInit = Rpc.ErrorInit

  type MetricEvent = Exclude<Rpc.Metric.Event, { type: `request:${string}` }>

  type Options<C = unknown> = Rpc.Options.Handler<C, MetricEvent>
}