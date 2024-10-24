import FiCsElement from '../core/class'
import type {
  Action,
  Attrs,
  ClassName,
  Descendant,
  Hooks,
  Inheritance,
  IndividualCssContent,
  Options,
  Sanitized,
  SingleOrArray,
  Syntaxes
} from '../core/types'

export type Content<D extends object> = Descendant | Sanitized<D, {}>

export interface FiCsLink<D extends object> {
  href: string
  content: (params: Syntaxes<D, {}>) => Content<D>
  router: FiCsElement<D, {}>
  inheritances?: SingleOrArray<Inheritance<D, {}>>
  className?: ClassName<D, {}>
  attributes?: Attrs<D, {}>
  css?: SingleOrArray<IndividualCssContent<D, {}>>
  actions?: SingleOrArray<Action<D, {}>>
  hooks?: Hooks<D, {}>
  options?: Exclude<Options, { immutable: boolean }>
}

export interface FiCsRouter<D extends object> {
  pages: (PageContent<D> & { path: SingleOrArray })[]
  notFound?: PageContent<D>
  data?: () => D
  inheritances?: SingleOrArray<Inheritance<D, {}>>
  className?: ClassName<D, {}>
  attributes?: Attrs<D, {}>
  css?: SingleOrArray<IndividualCssContent<D, {}>>
  actions?: SingleOrArray<Action<D, {}>>
  hooks?: Hooks<D, {}>
  options?: Exclude<Options, { immutable: boolean }>
}

export interface PageContent<D extends object> {
  content: (params: Syntaxes<D, {}>) => Content<D>
  redirect?: string
}
