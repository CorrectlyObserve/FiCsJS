import FiCsElement from '../core/class'
import type {
  Action,
  Attrs,
  ClassName,
  CssContent,
  Hooks,
  Options,
  Props,
  ResultContent,
  SingleOrArray,
  Syntaxes
} from '../core/types'

export interface FiCsLink<D extends object, P extends object> {
  href: string
  content: (syntaxes: Syntaxes<D, P>) => ResultContent<D, P>
  router: FiCsElement<D, P>
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  css?: SingleOrArray<string | CssContent<D, P>>
  actions?: Action<D, P>[]
  hooks?: Hooks<D, P>
  options?: Omit<Partial<Options>, 'immutable'>
}

export interface FiCsRouter<D extends object, P extends object> {
  pages: (PageContent<D, P> & { paths: SingleOrArray })[]
  notFound?: PageContent<D, P>
  data?: () => D
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  css?: SingleOrArray<string | CssContent<D, P>>
  actions?: Action<D, P>[]
  hooks?: Hooks<D, P>
  options?: Omit<Partial<Options>, 'immutable'>
}

export interface PageContent<D extends object, P extends object> {
  content: (syntaxes: Syntaxes<D, P>) => ResultContent<D, P>
  redirect?: string
}
