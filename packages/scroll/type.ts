import type {
  Actions,
  Attrs,
  ClassName,
  Css,
  Descendant,
  GlobalCssContent,
  Hooks,
  OptionParams,
  Props,
  Sanitized,
  ServerSentEvents,
  Scroll,
  SingleOrArray
} from '../core/types'

export interface FiCsScroll<D, P extends object> {
  name: string
  children?: Descendant[]
  array: D[]
  props?: SingleOrArray<Props<ScrollData<D>, P>>
  className?: ClassName<ScrollData<D>, P>
  attributes?: Attrs<ScrollData<D>, P>
  content: (item: D, index: number) => Sanitized<ScrollData<D>, P>
  scroll: Omit<Scroll<D, P>, 'isEnabled' | 'indexes'>
  css?: SingleOrArray<Exclude<Css<ScrollData<D>, P>, GlobalCssContent>>
  hooks?: Hooks<ScrollData<D>, P>
  actions?: Actions<ScrollData<D>, P>
  options?: OptionParams
  sse?: ServerSentEvents<ScrollData<D>, P>
}

export interface ScrollData<D> {
  array: D[]
}
