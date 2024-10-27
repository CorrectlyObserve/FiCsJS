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

export interface FiCsLink<D extends object> {
  href: string
  content: (syntaxes: Syntaxes<D, {}>) => Descendant | Sanitized<D, {}>
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
  pages: (PageContent<D> & { paths: SingleOrArray })[]
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
  content: (syntaxes: Syntaxes<D, {}>) => Descendant | Sanitized<D, {}>
  redirect?: string
}
