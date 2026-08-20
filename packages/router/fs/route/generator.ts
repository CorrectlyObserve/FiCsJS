import type { Routing } from '../../types'
import { ERROR_PATH, fileNames, prefixes } from '../constants'
import { getDirName, getOrThrow, indent, joinAndWrap, joinLines } from '../helpers'
import { findStatusEntry } from './finder'
import { toEntry } from './path'

const emitEntry = ({
    length,
    path,
    config,
    entry
  }: {
    length?: number
    path: string
    config: string
    entry?: string
  }): string => {
    const values: string[] = [`path: '${path}'`, `page: ${config}`]
    if (entry !== undefined) values.push(`entry: '${entry}'`)

    return `${indent(length)}${joinAndWrap(values)}`
  },
  emitPageConfig = ({
    base,
    layout,
    layoutAlias,
    shouldApply = true
  }: {
    base: string
    layout: string | null
    layoutAlias: Routing.Build.Layout['layoutAlias']
    shouldApply?: boolean
  }): string => {
    if (layout === null || !shouldApply) return base
    return [base, `layout: ${getOrThrow(layoutAlias, layout)}`].join(', ')
  },
  isSpaScoped = (layout: string | null, dir: string): boolean => {
    if (layout === null) return false

    const layoutDir: string = getDirName(layout)
    return dir === '' || layoutDir === dir || layoutDir.startsWith(`${dir}/`)
  }

export const generateEntries = ({
  routes,
  serverLayouts,
  layoutAlias,
  spaAlias,
  spaOwners,
  areSpaEntry,
  rootStatusFiles
}: Routing.Build.Ctx): string[] => {
  const existingRoutes: string[] = [],
    spaConfigs: Map<string, string> = new Map(),
    spaEntries: Map<string, string> = new Map(),
    rowAt = (
      index: number
    ): {
      path: string
      serverSpecifier: Routing.RouteEntry['serverSpecifier']
      spaOwner: string | null
      isMpa: boolean
      layout: Routing.Build.Layout['serverLayouts'][number]
    } => {
      const { path, serverSpecifier }: Routing.RouteEntry = routes[index],
        spaOwner: string | null = spaOwners[index]

      return {
        path,
        serverSpecifier,
        spaOwner,
        isMpa: spaOwner === null,
        layout: serverLayouts[index]
      }
    }

  /**
   * @remarks
   * Resolves all SPA configs first before emitting routes to prevent references to uninitialized entry configs.
   */
  for (let i = 0; i < routes.length; i++) {
    const { path, spaOwner, isMpa, layout }: ReturnType<typeof rowAt> = rowAt(i)
    if (isMpa || !areSpaEntry[i]) continue

    spaConfigs.set(
      spaOwner!,
      emitPageConfig({
        base: joinAndWrap([
          `default: () => ${getOrThrow(spaAlias, spaOwner!)}.toString()`,
          `meta: (client${i} as { meta?: Record<string, string> }).meta`
        ]),
        layout,
        layoutAlias
      })
    )
    spaEntries.set(spaOwner!, toEntry(path))
  }

  for (let i = 0; i < routes.length; i++) {
    const { path, serverSpecifier, spaOwner, isMpa, layout }: ReturnType<typeof rowAt> = rowAt(i)

    if (isMpa) {
      existingRoutes.push(
        emitEntry({
          path,
          config: emitPageConfig({
            base: serverSpecifier === null ? '{}' : `server${i}`,
            layout,
            layoutAlias
          }),
          entry: toEntry(path)
        })
      )
      continue
    }

    const config: string | undefined = spaConfigs.get(spaOwner!)
    if (config) existingRoutes.push(emitEntry({ path, config, entry: spaEntries.get(spaOwner!) }))
  }

  return [
    'export const routes = [',
    joinLines(
      [
        ...existingRoutes,
        ...rootStatusFiles.map(({ path, prop, serverSrc }) =>
          emitEntry({
            path,
            config: serverSrc === null ? '{}' : `__${prop}`,
            entry: findStatusEntry({ routes, spaOwners, areSpaEntry, path })
          })
        )
      ],
      { comma: true }
    ),
    `]`
  ]
}

export const generatePages = ({
  routes,
  middlewares,
  middlewareAlias,
  spaOwners,
  areSpaEntry,
  rootStatusFiles,
  statusFallback,
  redirect
}: Routing.Build.Ctx): string => {
  const toAlias = (src: string): string => getOrThrow(middlewareAlias, src),
    mwEntries: string[] = routes.map(({ path }, index) => {
      const chain: string[] = middlewares[index]
      return chain.length === 0
        ? ''
        : `${indent(2)}${JSON.stringify(path)}: ${joinAndWrap(chain.map(toAlias), { wrapType: '[]' })}`
    }),
    statusPages: string[] = rootStatusFiles.map(
      ({ path, prop, serverSrc }) =>
        `${path.slice(1)}: ${joinAndWrap([
          `module: ${serverSrc === null ? '{}' : `__${prop}`}`,
          `entry: '${findStatusEntry({ routes, spaOwners, areSpaEntry, path })}'`
        ])}`
    ),
    fallback: string | null =
      statusFallback &&
      joinAndWrap([
        `module: ${statusFallback.serverSrc === null ? '{}' : prefixes.ERROR}`,
        `entry: '${findStatusEntry({ routes, spaOwners, areSpaEntry, path: ERROR_PATH })}'`
      ])

  return joinLines([
    'export const pages = {',
    joinLines(
      [
        `${indent()}routes`,
        `${indent()}middlewares: ${
          mwEntries.some(Boolean)
            ? joinLines(['{', joinLines(mwEntries, { comma: true, filter: true }), `${indent()}}`])
            : '{}'
        }`,
        `${indent()}statusPages: ${statusPages.length > 0 ? joinAndWrap(statusPages) : '{}'}`,
        fallback ? `${indent()}statusFallback: ${fallback}` : '',
        redirect ? `${indent()}redirects` : ''
      ],
      { comma: true, filter: true }
    ),
    '}'
  ])
}

export const generateSpaRouters = ({
  routes,
  clientLayouts,
  layoutAlias,
  dirs,
  spaAlias,
  configAlias,
  spaOwners,
  statusFiles,
  aliases,
  inheritedStatusKeys,
  redirect
}: Routing.Build.Ctx): string => {
  return joinLines(
    dirs.map(dir => {
      const routeEntries: string[] = []

      for (let i = 0; i < routes.length; i++) {
        if (spaOwners[i] !== dir) continue

        const layout: string | null = clientLayouts[i]
        routeEntries.push(
          emitEntry({
            length: 2,
            path: routes[i].path,
            config: emitPageConfig({
              base: `client${i}`,
              layout,
              layoutAlias,
              shouldApply: isSpaScoped(layout, dir)
            })
          })
        )
      }

      const lines: string[] = [
          `export const ${getOrThrow(spaAlias, dir)} = ficsRouter(${getOrThrow(configAlias, dir)}, {`,
          `${indent()}routes: [`,
          joinLines(routeEntries, { comma: true }),
          `${indent()}]`
        ],
        statusKeys: string[] = Array.from(statuses.get(dir)?.keys() || [])

      if (statusKeys.length > 0) {
        lines[lines.length - 1] += ','
        lines.push(
          `${indent()}statusModules: {`,
          joinLines(
            statusKeys.map(key => {
              const alias: Map<string, string> = getOrThrow(aliases, dir)
              return `${indent(2)}${key}: ${getOrThrow(alias, key)}`
            }),
            { comma: true }
          ),
          `${indent()}}`
        )
      }

      const isRootDir: boolean = dir === ''
      if (isRootDir && redirect) {
        lines[lines.length - 1] += ','
        lines.push(`${indent()}redirects: ${prefixes.REDIRECT}`)
      }

      return joinLines([...lines, '})'])
    })
  )
}
