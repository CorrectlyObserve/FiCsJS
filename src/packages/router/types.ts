import FiCsElement from '../core/class'
import type {
  Action,
  Attrs,
  ClassName,
  Css,
  HtmlContent,
  Hooks,
  Reflections,
  Sanitized,
  Syntax
} from '../core/types'

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
  pages: (params: Syntax<RouterData, {}>) => (PageContent & { path: string })[]
  notFound?: (params: Syntax<RouterData, {}>) => PageContent
  reflections?: Reflections<RouterData>
  className?: ClassName<RouterData, {}>
  attributes?: Attrs<RouterData, {}>
  css?: Css<RouterData, {}>
  actions?: Action<RouterData, {}>[]
  hooks?: Hooks<RouterData, {}>
}

export interface LinkData {
  content: (syntax: Syntax<RouterData, {}>) => HtmlContent<LinkData, {}> | Sanitized<LinkData, {}>
}

export interface PageContent {
  content: HtmlContent<RouterData, {}> | Sanitized<RouterData, {}>
  redirect?: string
}

export interface RouterData {
  pathname: string
}
