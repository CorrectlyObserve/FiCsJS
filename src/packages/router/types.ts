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
  href:
    | string
    | (($setPathParams: (path: string, params: Record<string, string>) => string) => string)
  router: FiCsElement<RouterData, {}>
  className?: ClassName<LinkData, {}>
  attributes?: Attrs<LinkData, {}>
  css?: Css<LinkData, {}>
  actions?: Action<LinkData, {}>[]
  hooks?: Hooks<LinkData, {}>
}

export interface FiCsRouter {
  pages: (PageContent & { path: string })[]
  notFound?: PageContent | ((params: Syntax<RouterData, {}>) => PageContent)
  reflections?: Reflections<RouterData>
  className?: ClassName<RouterData, {}>
  attributes?: Attrs<RouterData, {}>
  css?: Css<RouterData, {}>
  actions?: Action<RouterData, {}>[]
  hooks?: Hooks<RouterData, {}>
}

export interface LinkData {
  content: RouterContent<{}> | ((params: Syntax<{}, {}>) => RouterContent<{}>)
}

export interface PageContent {
  content: (params: Syntax<RouterData, {}>) => RouterContent<RouterData>
  redirect?: string
}

type RouterContent<D extends object> = HtmlContent<D, {}> | Sanitized<D, {}>

export interface RouterData {
  pathname: string
}
