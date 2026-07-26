import { convertStr, joinArray } from '../../../core/helpers'
import type { Routing } from '../../types'
import { COMMENT, fileNames, prefixes, routerImport } from '../constants'
import { getDirName, getOrThrow, indent, joinAndWrap, joinLines, toSpecifier } from '../helpers'
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
    return joinArray([base, `layout: ${getOrThrow(layoutAlias, layout)}`])
  }

export const generateEntries = ({
  routes,
  layouts,
  layoutAlias,
  spaAlias,
  spaOwners,
  areSpaEntry,
  globalStatus
}: Routing.Build.Ctx): string[] => {
  const existingRoutes: string[] = [],
    spaConfigs: Map<string, string> = new Map(),
    spaEntries: Map<string, string> = new Map()

  for (let i = 0; i < routes.length; i++) {
    const spaOwner: string | null = spaOwners[i],
      isMpa: boolean = spaOwner === null
    if (isMpa || !areSpaEntry[i]) continue

    spaConfigs.set(
      spaOwner!,
      emitPageConfig({
        base: joinAndWrap([
          `default: () => ${getOrThrow(spaAlias, spaOwner!)}.toString()`,
          `meta: (client${i} as { meta?: Record<string, string> }).meta`
        ]),
        layout: layouts[i],
        layoutAlias
      })
    )
    spaEntries.set(spaOwner!, toEntry(routes[i].path))
  }

  for (let i = 0; i < routes.length; i++) {
    const { path }: Routing.RouteEntry = routes[i],
      spaOwner: string | null = spaOwners[i],
      isMpa: boolean = spaOwner === null

    if (isMpa) {
      const { serverSpecifier }: Routing.RouteEntry = routes[i]
      existingRoutes.push(
        emitEntry({
          path,
          config: emitPageConfig({
            base: serverSpecifier === null ? '{}' : `server${i}`,
            layout: layouts[i],
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
        ...globalStatus.map(({ path, prop, serverSrc }) =>
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

export const generateExports = ({
  routes,
  spaOwners,
  areSpaEntry,
  globalStatus,
  redirect
}: Routing.Build.Ctx): string => {
  const uniques: string[] = [
    ...new Set([...routes.map(({ path }) => path), ...globalStatus.map(({ path }) => path)])
  ]

  return joinLines([
    ...Object.keys(fileNames.statuses).map(key => {
      const prop: string = convertStr(key, 'camel'),
        status: Routing.GlobalStatuses[number] | undefined = globalStatus.find(
          ({ prop: p }) => p === prop
        )

      if (!status) return `export const ${prop} = undefined`

      const { path, serverSrc }: { path: string; serverSrc: string | null } = status
      return `export const ${prop} = ${joinAndWrap([
        `module: ${serverSrc === null ? '{}' : `__${prop}`}`,
        `entry: '${findStatusEntry({ routes, spaOwners, areSpaEntry, path })}'`
      ])}`
    }),
    `export const redirects = ${redirect ? prefixes.REDIRECT : 'undefined'}`,
    `export type FiCsRoutingPath = ${uniques.length === 0 ? 'never' : uniques.map(path => `'${path}'`).join(' | ')}`
  ])
}

export const generateImports = ({
  baseDir,
  routes,
  uniques,
  layoutAlias,
  dirs,
  files,
  configAlias,
  spaOwners,
  globalStatus,
  redirect,
  statuses,
  aliases
}: { baseDir: string } & Routing.Build.Ctx): string => {
  const _toSpecifier = (src: string): string => `'${toSpecifier(src, baseDir)}'`
  return joinLines(
    [
      dirs.length > 0 ? `import { ficsRouter } from ${routerImport()}` : '',
      ...uniques.map(
        src => `import * as ${getOrThrow(layoutAlias, src)} from ${_toSpecifier(src)}`
      ),
      ...routes.flatMap(({ serverSpecifier, specifier }, index) => {
        const imports: string[] = []

        if (serverSpecifier !== null)
          imports.push(`import * as server${index} from '${serverSpecifier}'`)

        if (spaOwners[index] !== null)
          imports.push(`import * as client${index} from '${specifier}'`)

        return imports
      }),
      ...dirs.flatMap(dir => [
        `import ${getOrThrow(configAlias, dir)} from ${_toSpecifier(getOrThrow(files, dir))}`,
        ...Array.from(getOrThrow(statuses, dir).entries()).map(([prop, src]) => {
          const alias: Map<string, string> = getOrThrow(aliases, dir)
          return `import * as ${getOrThrow(alias, prop)} from ${_toSpecifier(src)}`
        })
      ]),
      ...globalStatus.flatMap(({ prop, serverSrc }) =>
        serverSrc === null ? [] : [`import * as __${prop} from ${_toSpecifier(serverSrc)}`]
      ),
      redirect ? `import ${prefixes.REDIRECT} from ${_toSpecifier(redirect)}` : ''
    ].filter(Boolean)
  )
}

export const generateSpaRouters = ({
  routes,
  layouts,
  layoutAlias,
  dirs,
  spaAlias,
  configAlias,
  spaOwners,
  statuses,
  aliases,
  redirect
}: Routing.Build.Ctx): string => {
  return joinLines(
    dirs.map(dir => {
      const routeEntries: string[] = []

      for (let i = 0; i < routes.length; i++) {
        if (spaOwners[i] !== dir) continue

        const layout: string | null = layouts[i],
          isUnderBoundary = (layout: string): boolean => getDirName(layout).startsWith(`${dir}/`)

        routeEntries.push(
          emitEntry({
            length: 2,
            path: routes[i].path,
            config: emitPageConfig({
              base: `client${i}`,
              layout,
              layoutAlias,
              shouldApply: layout !== null && isUnderBoundary(layout)
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

export const generateMiddleware = ({
  baseDir,
  routes,
  middlewares,
  uniqueMiddlewares,
  middlewareAlias
}: { baseDir: string } & Routing.Build.Ctx): string => {
  const toAlias = (src: string): string => getOrThrow(middlewareAlias, src)

  return joinLines([
    COMMENT,
    `import ${routerImport('server-only')}`,
    ...uniqueMiddlewares.map(src => `import ${toAlias(src)} from '${toSpecifier(src, baseDir)}'`),
    '',
    'export const middlewares = {',
    joinLines(
      routes
        .map(({ path }, index) => {
          const chain: string[] = middlewares[index]
          return chain.length === 0
            ? ''
            : `${indent()}${JSON.stringify(path)}: ${joinAndWrap(chain.map(toAlias), { wrapType: '[]' })}`
        })
        .filter(Boolean),
      { comma: true }
    ),
    '}',
    ''
  ])
}
