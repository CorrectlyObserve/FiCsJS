import FiCsElement from '../core/class'
import type {
  Action,
  Attrs,
  ClassName,
  CssContent,
  Descendant,
  Hooks,
  Props,
  Options,
  Sanitized,
  SingleOrArray,
  Syntaxes
} from '../core/types'

export interface FiCsLink<D extends object> {
  href: string
  content: (syntaxes: Syntaxes<D, {}>) => Descendant | Sanitized<D, {}>
  router: FiCsElement<D, {}>
  props?: SingleOrArray<Props<D, {}>>
  className?: ClassName<D, {}>
  attributes?: Attrs<D, {}>
  css?: SingleOrArray<string | CssContent<D, {}>>
  actions?: Action<D, {}>[]
  hooks?: Hooks<D, {}>
  options?: Omit<Options, 'immutable'>
}

export interface FiCsRouter<D extends object> {
  pages: (PageContent<D> & { paths: SingleOrArray })[]
  notFound?: PageContent<D>
  data?: () => D
  props?: SingleOrArray<Props<D, {}>>
  className?: ClassName<D, {}>
  attributes?: Attrs<D, {}>
  css?: SingleOrArray<string | CssContent<D, {}>>
  actions?: Action<D, {}>[]
  hooks?: Hooks<D, {}>
  options?: Omit<Options, 'immutable'>
}

export interface PageContent<D extends object> {
  content: (syntaxes: Syntaxes<D, {}>) => Descendant | Sanitized<D, {}>
  redirect?: string
}
