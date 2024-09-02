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
  isOnlyCsr?: boolean
  className?: ClassName<LinkData, {}>
  attributes?: Attrs<LinkData, {}>
  css?: Css<LinkData, {}>
  actions?: Action<LinkData, {}>[]
  hooks?: Hooks<LinkData, {}>
}

export interface FiCsRouter {
  pages: ($template: Sanitize<RouterData, {}>) => Record<string, RouterContent<RouterData>>
  reflections?: Reflections<RouterData>
  inheritances?: Inheritances<RouterData>
  isOnlyCsr?: boolean
  className?: ClassName<RouterData, {}>
  attributes?: Attrs<RouterData, {}>
  css?: Css<RouterData, {}>
  actions?: Action<RouterData, {}>[]
  hooks?: Hooks<RouterData, {}>
}

export interface LinkData {
  anchor: RouterContent<LinkData>
}

export type RouterContent<D extends object> = HtmlContent<D, {}> | Sanitized<D, {}>

export interface RouterData {
  pathname: string
}
