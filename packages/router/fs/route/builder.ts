import { convertStr, toLowerFirst, typedEntries } from '../../../core/helpers'
import { prependSlash } from '../../helpers'
import { getAllMiddlewares } from '../middleware'
import type { Routing } from '../../types'
import { fileNames, prefixes } from '../constants'
import { cleanPath, getDirName, getFiles, isValidFileType, toPascal, toSpecifier } from '../helpers'
import { findClosestDir, findFileSrc } from './finder'
import { compareRoutes, toRoute } from './path'

export const buildEntries = ({
  filePaths,
  extensions,
  baseDir
}: Omit<Routing.Build.Query, 'routes'> & { baseDir: string }): Routing.RouteEntry[] => {
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

    const serverSrc: string | null = findFileSrc({
      filePaths,
      extensions,
      target: fileNames.PAGE_SERVER,
      dir: getDirName(filePath)
    })

    routes.push({
      path,
      specifier: toSpecifier(filePath, baseDir),
      src: filePath,
      serverSpecifier: serverSrc === null ? null : toSpecifier(serverSrc, baseDir)
    })
  }

  return routes.sort(compareRoutes)
}

export const buildLayout = ({
  routes,
  filePaths,
  extensions
}: Routing.Build.Query): Routing.Build.Layout => {
  const layoutFiles: Map<string, string> = getFiles({
      filePaths,
      expectedType: fileNames.LAYOUT,
      extensions
    }),
    layouts: Routing.Build.Layout['layouts'] = routes.map(
      ({ src }) => findClosestDir(src, layoutFiles)?.value ?? null
    ),
    uniqueLayouts: Routing.Build.Layout['uniqueLayouts'] = [
      ...new Set(layouts.filter((layout): layout is string => layout !== null))
    ]

  return {
    layouts,
    uniqueLayouts,
    layoutAlias: new Map(
      uniqueLayouts.map((layout, index) => [layout, `${prefixes.LAYOUT}${index}`])
    )
  }
}

export const buildMiddleware = ({
  routes,
  filePaths,
  extensions,
  spaOwners,
  files
}: Routing.Build.Query &
  Pick<Routing.Build.Spa, 'spaOwners' | 'files'>): Routing.Build.Middleware => {
  const middlewareFiles: Map<string, string> = getFiles({
      filePaths,
      extensions,
      expectedType: fileNames.MIDDLEWARE
    }),
    middlewares: string[][] = routes.map(({ src }, index) =>
      getAllMiddlewares(
        (spaOwners[index] ?? getDirName(src)).split('/').filter(Boolean),
        middlewareFiles
      )
    ),
    uniqueMiddlewares: string[] = [...new Set(middlewares.flat())]

  for (const [dir, src] of middlewareFiles) {
    const spaOwner: string | null = findClosestDir(src, files)?.key ?? null,
      isMpa: boolean = spaOwner === null,
      isSpaRoot: boolean = spaOwner === dir

    /** @remarks These protect HTML loads, not just RPC calls. */
    if (isMpa || isSpaRoot) continue

    const hasRpc: boolean = filePaths.some(path => {
      const cleaned: string = cleanPath(path),
        file: string = cleaned.split('/').at(-1) ?? ''

      return (
        cleaned.startsWith(`${dir}/`) &&
        isValidFileType({ file, expectedType: fileNames.RPC, extensions })
      )
    })

    if (!hasRpc)
      throw new Error(`The middleware "${src}" has no descendant RPC procedures in the "${dir}"...`)
  }

  return {
    middlewares,
    uniqueMiddlewares,
    middlewareAlias: new Map(
      uniqueMiddlewares.map((src, index) => [src, `${prefixes.MIDDLEWARE}${index}`])
    )
  }
}

export const buildSpa = ({
  routes,
  filePaths,
  extensions
}: Routing.Build.Query): Routing.Build.Spa => {
  const files = getFiles({ filePaths, extensions, expectedType: fileNames.SPA_CONFIG }),
    dirs: string[] = Array.from(files.keys()).sort(),
    spaAlias: Map<string, string> = new Map<string, string>(),
    configAlias: Map<string, string> = new Map<string, string>()

  for (const dir of dirs) {
    const name: string = `${toPascal(dir)}Router`
    spaAlias.set(dir, name)
    configAlias.set(dir, `__${toLowerFirst(name)}Config`)

    const error: string = `The nested SPA '${dir}/${fileNames.SPA_CONFIG}' is not supported...`
    let parent: string = dir
    while (parent.includes('/')) {
      parent = parent.slice(0, parent.lastIndexOf('/'))
      if (files.has(parent)) throw new Error(error)
    }

    if (files.has('') && dir !== '') throw new Error(error)
  }

  const spaOwners: (string | null)[] = routes.map(
      ({ src }) => findClosestDir(src, files)?.key ?? null
    ),
    areSpaEntry: boolean[] = []

  for (let i = 0; i < routes.length; i++) {
    const spaOwner: string | null = spaOwners[i],
      isSpa: boolean = spaOwner !== null,
      { src, serverSpecifier }: Routing.RouteEntry = routes[i]

    if (isSpa && serverSpecifier !== null)
      throw new Error(
        `A "+page.server.ts" next to "${src}" cannot live inside the SPA "${spaOwner || '(root)'}"...`
      )

    areSpaEntry.push(isSpa && spaOwner === getDirName(src))
  }

  return { dirs, files, spaAlias, configAlias, spaOwners, areSpaEntry }
}

export const buildSpecial = ({
  dirs,
  filePaths,
  extensions
}: Omit<Routing.Build.Query, 'routes'> & { dirs: string[] }): Routing.Build.Special => {
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

  const globalStatuses: Routing.GlobalStatuses = statusEntries.reduce<Routing.GlobalStatuses>(
    (entries, [key, target]) => {
      const src: string | null = findFileSrc({ filePaths, extensions, target })

      if (src !== null)
        entries.push({
          prop: convertStr(key, 'camel'),
          path: prependSlash(target.slice(1)),
          src,
          serverSrc: findFileSrc({ filePaths, extensions, target: `${target}.server` })
        })

      return entries
    },
    []
  )

  return {
    globalStatuses,
    redirect: findFileSrc({ filePaths, extensions, target: fileNames.REDIRECT }),
    statuses,
    aliases
  }
}
