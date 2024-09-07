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

type ArrowFuncOrValue<V, D extends object> = V | ((params: Syntax<D, {}>) => V)

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
  pages: ArrowFuncOrValue<(PageContent & { path: string })[], RouterData>
  notFound?: ArrowFuncOrValue<PageContent, RouterData>
  reflections?: Reflections<RouterData>
  className?: ClassName<RouterData, {}>
  attributes?: Attrs<RouterData, {}>
  css?: Css<RouterData, {}>
  actions?: Action<RouterData, {}>[]
  hooks?: Hooks<RouterData, {}>
}

export interface LinkData {
  content: ArrowFuncOrValue<RouterContent<{}>, {}>
}

export interface PageContent {
  content: RouterContent<RouterData>
  redirect?: string
}

type RouterContent<D extends object> = HtmlContent<D, {}> | Sanitized<D, {}>

export interface RouterData {
  pathname: string
}
