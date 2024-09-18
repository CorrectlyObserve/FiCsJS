import FiCsElement from '../core/class'
import type { Action, Attrs, ClassName, Css, Hooks, Sanitized, Syntax } from '../core/types'

export interface FiCsLink extends LinkData {
  href: string
  router: FiCsElement<RouterData, {}>
  className?: ClassName<LinkData, {}>
  attributes?: Attrs<LinkData, {}>
  css?: Css<LinkData, {}>
  actions?: Action<LinkData, {}>[]
  hooks?: Hooks<LinkData, {}>
}

export interface FiCsRouter {
  pages: (PageContent & { path: string })[]
  notFound?: PageContent
  className?: ClassName<RouterData, {}>
  attributes?: Attrs<RouterData, {}>
  css?: Css<RouterData, {}>
  actions?: Action<RouterData, {}>[]
  hooks?: Hooks<RouterData, {}>
}

export interface LinkData {
  content: (params: Syntax<RouterData, {}>) => RouterContent
}

export interface PageContent extends LinkData {
  redirect?: string
}

export type RouterContent = FiCsElement<RouterData, {}> | Sanitized<RouterData, {}>

export interface RouterData {
  pathname: string
}
