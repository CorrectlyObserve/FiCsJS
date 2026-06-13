import type {
  Action,
  Attrs,
  ClassName as _ClassName,
  Css,
  Descendant,
  Hook,
  Props as _Props,
  Options,
  SingleOrArray
} from '../core/types'
import type { Content as _Content, Page, PageContent, RouterData } from './types'

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

  type ClassName<D extends object> = _ClassName<RouterData<D>, {}> | undefined

  type Children = Descendant[] | undefined

  type Css<D extends object> = Css.Ctx<RouterData<D>, {}> | undefined

  type Hooks<D extends object> = Hook.Lifecycle<RouterData<D>, {}> | undefined

  type Layout<D extends object> = _Content<RouterData<D>, {}, { slot: Returned<D, {}> }>

  type Options<D extends object> = Options.Ctx<RouterData<D>, {}> | undefined

  type Page<D extends object> = _Content<RouterData<D>, {}>

  type Props<D extends object> = SingleOrArray<_Props<RouterData<D>, {}>> | undefined
}
