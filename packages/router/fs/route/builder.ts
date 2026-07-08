import { convertStr, typedEntries } from './../../../core/helpers'
import { prependSlash } from './../../helpers'
import type { Routing } from './../../types'
import { fileNames, prefixes } from './../constants'
import { getFiles, toSpecifier } from './../helpers'
import { findClosestDir, findFileSrc } from './finder'
import { compareRoutes, toRoute } from './path'

export const buildEntries = ({
  filePaths,
  extensions,
  baseDir
}: Omit<Routing.BuilderQuery, 'routes'> & { baseDir: string }): Routing.RouteEntry[] => {
  const routes: Routing.RouteEntry[] = [],
    seen: Map<string, string> = new Map()

  for (const filePath of filePaths) {
    const path: string | null = toRoute(filePath, extensions)
    if (path === null) continue

    const existing: string | undefined = seen.get(path)
    if (existing)
      throw new Error(
        `The duplicated route "${path}" is defined in both "${existing}" and "${filePath}"...`
      )
    seen.set(path, filePath)
    routes.push({ path, specifier: toSpecifier(filePath, baseDir), src: filePath })
  }

  return routes.sort(compareRoutes)
}

export const buildLayoutCtx = ({
  routes,
  filePaths,
  extensions
}: Routing.BuilderQuery): Routing.Ctx.Layout => {
  const layoutFiles: Map<string, string> = getFiles({
      filePaths,
      expectedType: fileNames.LAYOUT,
      extensions
    }),
    layouts: Routing.Ctx.Layout['layouts'] = routes.map(
      ({ src }) => findClosestDir(src, layoutFiles)?.value ?? null
    ),
    uniques: Routing.Ctx.Layout['uniques'] = [
      ...new Set(layouts.filter((layout): layout is string => layout !== null))
    ]

  return {
    layouts,
    uniques,
    alias: new Map(uniques.map((layout, index) => [layout, `${prefixes.LAYOUT}${index}`]))
  }
}

export const buildSpecialCtx = ({
  dirs,
  filePaths,
  extensions
}: Omit<Routing.BuilderQuery, 'routes'> & { dirs: string[] }): Routing.Ctx.Special => {
  const statusEntries = typedEntries(fileNames.statuses),
    statuses: Map<string, Map<string, string>> = new Map<string, Map<string, string>>(),
    aliases: Map<string, Map<string, string>> = new Map<string, Map<string, string>>()
  let counter: number = 0

  for (const dir of dirs) {
    const status: Map<string, string> = new Map<string, string>(),
      alias: Map<string, string> = new Map<string, string>()

    for (const [key, target] of statusEntries) {
      const prop: string = convertStr(key, 'camel'),
        src: string | null = findFileSrc({ filePaths, extensions, target, dir })

      if (src !== null) {
        status.set(prop, src)
        alias.set(prop, `${prefixes.STATUS}${counter++}`)
      }
    }

    statuses.set(dir, status)
    aliases.set(dir, alias)
  }

  const globalStatus: Routing.GlobalStatuses = statusEntries.reduce<Routing.GlobalStatuses>(
    (entries, [key, target]) => {
      const src: string | null = findFileSrc({ filePaths, extensions, target })

      if (src !== null)
        entries.push({ prop: convertStr(key, 'camel'), path: prependSlash(target.slice(1)), src })

      return entries
    },
    []
  )

  return {
    globalStatus,
    redirect: findFileSrc({ filePaths, extensions, target: fileNames.REDIRECT }),
    statuses,
    aliases
  }
}
