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
import type { Content as _Content, FiCsRouter as _FiCsRouter, Returned, RouterData } from './types'

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

export declare namespace FiCsRouting {
  type Host = Routing.Host

  type Module<C = Record<string, unknown>> = Routing.ServerModule<C>

  type Options<C = Record<string, unknown>> = Routing.Options.Register<C>

  type RedirectFn = Routing.RedirectFn

  type Redirects = Routing.Redirects

  type Render = Routing.Render

  type Route<C = Record<string, unknown>> = Routing.ServerRoute<C>
}