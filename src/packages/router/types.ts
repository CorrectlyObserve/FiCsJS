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
  pages: (syntax: Syntax<RouterData, {}>) => (RouterContent<true> & { path: string })[]
  notFound?: ({ $template, $html, $show, $i18n }: Syntax<RouterData, {}>) => RouterContent<false>
  reflections?: Reflections<RouterData>
  className?: ClassName<RouterData, {}>
  attributes?: Attrs<RouterData, {}>
  css?: Css<RouterData, {}>
  actions?: Action<RouterData, {}>[]
  hooks?: Hooks<RouterData, {}>
}

export interface LinkData {
  anchor: (syntax: Syntax<RouterData, {}>) => HtmlContent<LinkData, {}> | Sanitized<LinkData, {}>
}

type PageContent = HtmlContent<RouterData, {}> | Sanitized<RouterData, {}>

export interface RouterContent<B extends boolean> {
  content: B extends true ? () => PageContent : PageContent
  redirect?: (params: Record<string, string | number>) => string
}

export interface RouterData {
  pathname: string
}
