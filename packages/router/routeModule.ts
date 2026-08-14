import type { Page, PageContent, Routing } from './types'

export function resolveModule(module: Routing.Module): PageContent
export function resolveModule(module: Routing.Module, path: string): Page
export function resolveModule(module: Routing.Module, path?: string): Page | PageContent {
  const { default: def, redirect, meta }: Routing.Module = module,
    pageContent: PageContent = {}

  if (typeof redirect === 'string') pageContent.redirect = redirect
  else {
    if (def === undefined)
      throw new Error(
        `The ${path === undefined ? 'status module' : `module with path "${path}"`} must export default content or a "redirect" string...`
      )

    pageContent.content = (typeof def === 'function' ? def : () => def) as PageContent['content']
  }

  if (!pageContent.redirect && meta) pageContent.meta = meta

  return path === undefined ? pageContent : { path, ...pageContent }
}
