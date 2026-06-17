import { applyLayout } from './layout'
import { resolveModule } from './routeModule'
import type { Page, PageContent, Routing } from './types'

const registry: Routing.Resolved = { pages: [], statusModules: {}, redirectFn: undefined }

export const registerRoutes = (spec: Routing.Spec): void => {
  const { pages, statusModules, redirectFn }: Routing.Resolved = resolveRoutingSpec(spec)
  registry.pages = pages
  registry.statusModules = statusModules
  registry.redirectFn = redirectFn
}

export const resolveRoutingSpec = (spec?: Routing.Spec): Readonly<Routing.Resolved> => {
  if (!spec) return registry

  const { routes, redirects, statusModules }: Routing.Spec = spec,
    pages: Page[] = []

  for (const { path, module, layout } of routes)
    pages.push(resolveModule(layout ? applyLayout(layout, module) : module, path))

  let redirectFn: Routing.RedirectFn | undefined

  if (typeof redirects === 'function') redirectFn = redirects
  else if (redirects)
    for (const [path, redirect] of Object.entries(redirects)) pages.push({ path, redirect })

  const modules: Record<string, PageContent | undefined> = {}
  if (statusModules)
    for (const [key, module] of Object.entries(statusModules)) modules[key] = resolveModule(module)

  return { pages, statusModules: modules, redirectFn }
}

export const resetRoutes = (): void => {
  registry.pages = []
  registry.statusModules = {}
  registry.redirectFn = undefined
}
