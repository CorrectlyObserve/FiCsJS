import { STATUS_FALLBACK } from '../../constants'
import { indent, joinLines } from '../../helpers'
import type { Routing } from '../../types'
import { ERROR_PATH, exportedNames, prefixes } from '../constants'
import { getDirName, getOrThrow, joinAndWrap } from '../helpers'
import { findStatusEntry, hasClientEntry } from './finder'
import { toEntry, toSpaAlias } from './path'

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
  }

const toStatusEntry = ({
    routes,
    rootLayout,
    spaOwners,
    areSpaEntry,
    path,
    isServerOnly
  }: Pick<Routing.Build.Ctx, 'routes' | 'rootLayout' | 'spaOwners' | 'areSpaEntry'> & {
    path: string
    isServerOnly: boolean
  }): string | undefined => {
    const entry: string = findStatusEntry({ routes, spaOwners, areSpaEntry, path }),
      isServedBySpa: boolean = entry !== toEntry(path)

    return isServedBySpa || hasClientEntry({ isServerOnly, layout: rootLayout }) ? entry : undefined
  },
  isSpaScoped = (layout: string | null, dir: string): boolean => {
    if (layout === null) return false

    const layoutDir: string = getDirName(layout)
    return dir === '' || layoutDir === dir || layoutDir.startsWith(`${dir}/`)
  }

export const generateEntries = ({
  routes,
  rootLayout,
  clientLayouts,
  serverLayouts,
  layoutAlias,
  serverFiles,
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

    const router: string = getOrThrow(spaAlias, spaOwner!),
      hasServerFile: boolean = serverFiles.has(spaOwner!)

    spaConfigs.set(
      spaOwner!,
      emitPageConfig({
        base: joinAndWrap([
          `default: ${exportedNames.spaPage}(${router}${hasServerFile ? `, ${toSpaAlias(spaOwner!, 'SpaServer')}` : ''})`,
          `meta: (client${i} as { meta?: Record<string, string> }).meta`,
          ...(hasServerFile ? ['noStore: true'] : [])
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
          entry: hasClientEntry({ isServerOnly: routes[i].isServerOnly, layout: clientLayouts[i] })
            ? toEntry(path)
            : undefined
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
        ...rootStatusFiles.map(({ path, prop, serverSrc, isServerOnly }) =>
          emitEntry({
            path,
            config: serverSrc === null ? '{}' : `__${prop}`,
            entry: toStatusEntry({ routes, rootLayout, spaOwners, areSpaEntry, path, isServerOnly })
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
  rootLayout,
  middlewares,
  middlewareAlias,
  spaOwners,
  areSpaEntry,
  rootStatusFiles,
  statusFallback,
  redirect
}: Routing.Build.Ctx): string => {
  const toMwAlias = (src: string): string => getOrThrow(middlewareAlias, src),
    mwEntries: string[] = routes.map(({ path }, index) => {
      const chain: string[] = middlewares[index]
      return chain.length === 0
        ? ''
        : `${indent(2)}${JSON.stringify(path)}: ${joinAndWrap(chain.map(toMwAlias), { wrapType: '[]' })}`
    }),
    toStatusPage = ({
      module,
      path,
      isServerOnly
    }: {
      module: string
      path: string
      isServerOnly: boolean
    }): string => {
      const entry: string | undefined = toStatusEntry({
        routes,
        spaOwners,
        areSpaEntry,
        rootLayout,
        path,
        isServerOnly
      })

      return joinAndWrap([
        `module: ${module}`,
        ...(entry === undefined ? [] : [`entry: '${entry}'`])
      ])
    },
    statusPages: string[] = rootStatusFiles.map(({ path, prop, serverSrc, isServerOnly }) => {
      const module: string = serverSrc === null ? '{}' : `__${prop}`
      return `${path.slice(1)}: ${toStatusPage({ module, path, isServerOnly })}`
    }),
    fallback: string | null =
      statusFallback &&
      toStatusPage({
        module: statusFallback.serverSrc === null ? '{}' : prefixes.ERROR,
        path: ERROR_PATH,
        isServerOnly: statusFallback.isServerOnly
      })

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
  spaLayouts,
  layoutAlias,
  dirs,
  spaAlias,
  spaOwners,
  aliases,
  inheritedStatusKeys,
  redirect,
  rootStatusFiles
}: Routing.Build.Ctx): string => {
  const appPaths: string[] = Array.from(
      new Set([...routes, ...rootStatusFiles].map(({ path }) => path))
    ),
    hasMultipleRouters: boolean = dirs.length > 1,
    routers: string[] = dirs.map(dir => {
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

      const spaRouterName: string = getOrThrow(spaAlias, dir),
        lines: string[] = [
          `export const ${spaRouterName} = ficsRouter(${toSpaAlias(dir, 'Spa')}, {`,
          `${indent()}routes: [`,
          joinLines(routeEntries, { comma: true }),
          `${indent()}]`
        ],
        statusModules: string[] = [],
        append = (line: string): void => {
          lines[lines.length - 1] += ','
          lines.push(line)
        }
      let statusFallbackLine: string | undefined

      for (const [key, alias] of getOrThrow(aliases, dir))
        if (key === STATUS_FALLBACK) statusFallbackLine = `${indent()}statusFallback: ${alias}`
        else statusModules.push(`${indent(2)}${key}: ${alias}`)

      if (statusModules.length > 0) {
        const modulesLine: string = joinLines(statusModules, { comma: true })
        append(joinLines([`${indent()}statusModules: {`, modulesLine, `${indent()}}`]))
      }

      if (statusFallbackLine) append(statusFallbackLine)

      const statusLayout: string | undefined = spaLayouts.get(dir)
      if (statusLayout && (statusModules.length > 0 || statusFallbackLine))
        append(`${indent()}statusLayout: ${getOrThrow(layoutAlias, statusLayout)}`)

      const dirInheritedKeys: string[] = [...(inheritedStatusKeys.get(dir) ?? [])]
      if (dirInheritedKeys.length > 0) {
        const keysLine: string = joinAndWrap(
          dirInheritedKeys.map(key => `'${key}'`),
          { wrapType: '[]' }
        )
        append(`${indent()}inheritedStatusKeys: ${keysLine}`)
      }

      const isRootDir: boolean = dir === ''
      if (isRootDir && redirect) append(`${indent()}redirects: ${prefixes.REDIRECT}`)

      if (hasMultipleRouters) append(`${indent()}appPaths`)
      else
        append(
          joinLines([
            `${indent()}appPaths: [`,
            joinLines(
              appPaths.map(path => `${indent(2)}'${path}'`),
              { comma: true }
            ),
            `${indent()}]`
          ])
        )

      return joinLines([...lines, '})'])
    })

  return joinLines([
    ...(hasMultipleRouters
      ? [
          `const appPaths = ${joinAndWrap(
            appPaths.map(path => `'${path}'`),
            { wrapType: '[]' }
          )}`,
          ''
        ]
      : []),
    ...routers
  ])
}
