import { typedEntries } from '../core/helpers'
import { applyLayout } from './layout'
import { resolveModule } from './routeModule'
import type { Page, PageContent, Routing } from './types'

const registry: Routing.ResolvedSpec = { pages: [], statusModules: {} }

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

  const { routes, statusModules, statusFallback, inheritedStatuses }: Routing.Spec = spec,
    pages: Page[] = [],
    modules: Routing.ResolvedSpec['statusModules'] = {},
    inherited: ReadonlySet<string> = new Set(inheritedStatuses ?? [])

  for (const { path, page, layout } of routes)
    pages.push(resolveModule(applyLayout({ layout, page }), { path }))

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
