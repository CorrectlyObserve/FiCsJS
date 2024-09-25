import FiCsElement from '../core/class'
import type { Action, Attrs, ClassName, Css, Hooks, Sanitized, Syntax } from '../core/types'

export interface FiCsLink {
  href: string
  content: (params: Syntax<RouterData, {}>) => RouterContent
  router: FiCsElement<RouterData, {}>
  isOnlyCsr?: boolean
  className?: ClassName<{}, {}>
  attributes?: Attrs<{}, {}>
  css?: Css<{}, {}>
  actions?: Action<RouterData, {}>[]
  hooks?: Hooks<RouterData, {}>
}

export interface FiCsRouter {
  pages: (PageContent & { path: string })[]
  notFound?: PageContent
  isOnlyCsr?: boolean
  className?: ClassName<RouterData, {}>
  attributes?: Attrs<RouterData, {}>
  css?: Css<RouterData, {}>
  actions?: Action<RouterData, {}>[]
  hooks?: Hooks<RouterData, {}>
}

export interface PageContent {
  content: (params: Syntax<RouterData, {}>) => RouterContent
  redirect?: string
}

export type RouterContent = FiCsElement<{}, {}> | Sanitized<RouterData, {}>

export interface RouterData {
  pathname: string
}
