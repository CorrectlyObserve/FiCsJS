import { convertStr, toLowerFirst, typedEntries } from '../../../core/helpers'
import { prependSlash } from '../../helpers'
import type { Routing } from '../../types'
import { fileNames, prefixes } from '../constants'
import { getDirName, getFiles, toPascal, toSpecifier } from '../helpers'
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
    layoutAlias: new Map(uniques.map((layout, index) => [layout, `${prefixes.LAYOUT}${index}`]))
  }
}

export const buildSpaCtx = ({
  routes,
  filePaths,
  extensions
}: Routing.BuilderQuery): Routing.Ctx.Spa => {
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
  )

  for (let i = 0; i < routes.length; i++) {
    const spaOwner: string | null = spaOwners[i],
      { src, serverSpecifier }: Routing.RouteEntry = routes[i]

    if (spaOwner !== null && serverSpecifier !== null)
      throw new Error(
        `A "+page.server.ts" next to "${src}" cannot live inside the SPA "${spaOwner || '(root)'}"...`
      )
  }

  const areSpaRoot: boolean[] = routes.map(({ src }, index) => {
    const spaOwner: string | null = spaOwners[index]
    return spaOwner !== null && spaOwner === getDirName(src)
  })

  return { dirs, files, spaAlias, configAlias, spaOwners, areSpaRoot }
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
    globalStatus,
    redirect: findFileSrc({ filePaths, extensions, target: fileNames.REDIRECT }),
    statuses,
    aliases
  }
}
