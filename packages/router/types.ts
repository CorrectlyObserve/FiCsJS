import FiCsElement from '../core/class'
import type {
  Action,
  Attrs,
  ClassName,
  Css,
  Descendant,
  Hooks,
  Inheritances,
  Sanitized,
  SingleOrArray,
  Syntaxes
} from '../core/types'

export interface FiCsLink<D extends object> {
  href: string
  content: (params: Syntaxes<D, {}>) => Descendant | Sanitized<D, {}>
  router: FiCsRouterElement<D>
  inheritances?: Inheritances<D, {}>
  isOnlyCsr?: boolean
  className?: ClassName<D, {}>
  attributes?: Attrs<D, {}>
  css?: Css<D, {}>
  actions?: Action<D, {}>[]
  hooks?: Hooks<D, {}>
}

export interface FiCsRouter<D extends object> {
  pages: (PageContent<D> & { path: SingleOrArray })[]
  notFound?: PageContent<D>
  data?: () => D
  inheritances?: Inheritances<D, {}>
  isOnlyCsr?: boolean
  className?: ClassName<D, {}>
  attributes?: Attrs<D, {}>
  css?: Css<D, {}>
  actions?: Action<D, {}>[]
  hooks?: Hooks<D, {}>
}

export type FiCsRouterElement<D extends object> = FiCsElement<D, {}>

export interface PageContent<D extends object> {
  content: (params: Syntaxes<D, {}>) => Descendant | Sanitized<D, {}>
  redirect?: string
}

export type RouterContent<D extends object> = Descendant | Sanitized<D, {}>
