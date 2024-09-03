import FiCsElement from '../core/class'
import type {
  Action,
  Attrs,
  ClassName,
  Css,
  HtmlContent,
  Hooks,
  Inheritances,
  Reflections,
  Sanitize,
  Sanitized
} from '../core/types'

export interface FiCsLink extends LinkData {
  href: string
  router: FiCsElement<RouterData, {}>
  reflections?: Reflections<LinkData>
  inheritances?: Inheritances<LinkData>
  className?: ClassName<LinkData, {}>
  attributes?: Attrs<LinkData, {}>
  css?: Css<LinkData, {}>
  actions?: Action<LinkData, {}>[]
  hooks?: Hooks<LinkData, {}>
}

export interface FiCsRouter {
  pages: ({ $template }: Template) => (PageContent & { path: string })[]
  notFound?: ({ $template }: Template) => PageContent
  reflections?: Reflections<RouterData>
  className?: ClassName<RouterData, {}>
  attributes?: Attrs<RouterData, {}>
  css?: Css<RouterData, {}>
  actions?: Action<RouterData, {}>[]
  hooks?: Hooks<RouterData, {}>
}

export interface LinkData {
  anchor: ({ $template }: Template) => RouterContent<LinkData>
}

export interface PageContent {
  content: RouterContent<RouterData>
  redirect?: ({}) => string
}

export type RouterContent<D extends object> = HtmlContent<D, {}> | Sanitized<D, {}>

export interface RouterData {
  pathname: string
}

interface Template {
  $template: Sanitize<RouterData, {}>
}
