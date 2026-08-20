import type { Page, PageContent, Routing } from './types'

export function resolveModule(module: Routing.Module, options: { path: string }): Page

export function resolveModule(
  module: Routing.Module,
  options: { key: string; isOptional: boolean }
): PageContent | undefined

export function resolveModule(
  { default: def, redirect, meta }: Routing.Module,
  options: { path: string } | { key: string; isOptional: boolean }
): Page | PageContent | undefined {
  const pageContent: PageContent = {}

  if (typeof redirect === 'string') pageContent.redirect = redirect
  else {
    if (def === undefined) {
      if ('isOptional' in options && options.isOptional) return undefined

      const subject: string =
        'path' in options ? `module with path "${options.path}"` : `status module "${options.key}"`

      throw new Error(`The ${subject} must export default content or a "redirect" string...`)
    }

    pageContent.content = (typeof def === 'function' ? def : () => def) as PageContent['content']
  }

  if (!pageContent.redirect && meta) pageContent.meta = meta

  return 'path' in options ? { path: options.path, ...pageContent } : pageContent
}
