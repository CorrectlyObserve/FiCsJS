import { typedEntries } from '../core/helpers'
import { STATUS_FALLBACK } from './constants'
import { applyLayout } from './layout'
import type { Page, PageContent, Routing } from './types'

const registry: Routing.ResolvedSpec = { pages: [], statusModules: {} },
  resolveModule = ({ default: def, redirect, meta }: Routing.Module): PageContent | undefined => {
    if (typeof redirect === 'string') return { redirect }
    if (def === undefined) return undefined

    return {
      content: (typeof def === 'function' ? def : () => def) as PageContent['content'],
      meta
    }
  }

export const registerRoutes = (spec: Routing.Spec): void => {
  const { pages, statusModules, statusFallback }: Routing.ResolvedSpec = resolveSpec(spec)
  registry.pages = pages
  registry.statusModules = statusModules
  registry.statusFallback = statusFallback
}

export const resetRoutes = (): void => {
  registry.pages = []
  registry.statusModules = {}
  registry.statusFallback = undefined
}

export const resolveSpec = (spec?: Routing.Spec): Readonly<Routing.ResolvedSpec> => {
  if (!spec) return registry

  const { routes, statusModules, statusFallback, inheritedStatusKeys = [] }: Routing.Spec = spec,
    pages: Page[] = [],
    modules: Routing.ResolvedSpec['statusModules'] = {}

  for (const { path, page, layout } of routes) {
    const content: PageContent | undefined = resolveModule(applyLayout({ layout, page }))

    if (!content)
      throw new Error(
        `The module with path "${path}" must export default content or a "redirect"...`
      )

    pages.push({ path, ...content })
  }

  const resolveStatus = (module: Routing.Module, key: string): PageContent | undefined => {
    const content: PageContent | undefined = resolveModule(module)

    if (!content && !inheritedStatusKeys.includes(key))
      throw new Error(`The status module "${key}" must export default content or a "redirect"...`)

    return content
  }

  if (statusModules)
    for (const [key, module] of typedEntries(statusModules))
      modules[key] = resolveModule(module, { key, isOptional: inherited.has(key) })

  return {
    pages,
    statusModules: modules,
    statusFallback: statusFallback
      ? resolveModule(statusFallback, {
          key: STATUS_FALLBACK,
          isOptional: inherited.has(STATUS_FALLBACK)
        })
      : undefined
  }
}
