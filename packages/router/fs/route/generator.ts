import { convertStr, joinArray } from '../../../core/helpers'
import type { Routing } from '../../types'
import { getDirName, indent, joinAndWrap, joinLines, toSpecifier } from '../helpers'
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
  areSpaRoot,
  globalStatus
}: Routing.Build.Ctx): string[] => {
  const mainRoutes: string[] = [],
    catchAllRoutes: string[] = []

  for (let i = 0; i < routes.length; i++) {
    const { path }: Routing.RouteEntry = routes[i],
      spaOwner: string | null = spaOwners[i],
      layout: string | null = layouts[i]

    if (spaOwner === null) {
      mainRoutes.push(
        emitEntry({
          path,
          config: buildPageConfig({ base: `route${i}`, layout, layoutAlias })
        })
      )
      continue
    }

    if (areSpaRoot[i]) {
      const ref: string = `(route${i} as { meta?: Record<string, string> })`,
        config: string = buildPageConfig({
          base: `{ default: () => ${spaAlias.get(spaOwner)}.toString(), meta: ${ref}.meta }`,
          layout,
          layoutAlias
        })

      mainRoutes.push(buildEntry({ path, config }))

      const prefix: string = spaOwner ? `${buildRoute(spaOwner.split('/'))}/` : ''
      catchAllRoutes.push(buildEntry({ path: `/${prefix}:rest*`, config }))
    }
  }

  return [
    'export const routes = [',
    joinLines(
      [
        ...mainRoutes,
        ...globalStatus.map(({ path, prop }) => buildEntry({ path, config: `__${prop}` })),
        ...catchAllRoutes
      ],
      { comma: true }
    ),
    `]`
  ]
}

export const generateExports = (
  routes: Routing.RouteEntry[],
  { globalStatus, redirect }: Routing.Ctx.Special
): string => {
  const uniques: string[] = [
    ...new Set([...routes.map(({ path }) => path), ...globalStatus.map(({ path }) => path)])
  ]

  return joinLines([
    ...Object.keys(fileNames.statuses).map(key => {
      const prop: string = convertStr(key, 'camel')
      return `export const ${prop} = ${
        globalStatus.some(({ prop: p }) => p === prop) ? `__${prop}` : 'undefined'
      }`
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
      ...dirs.flatMap(dir => [
        `import ${getOrThrow(configAlias, dir)} from ${_toSpecifier(getOrThrow(files, dir))}`,
        ...Array.from(getOrThrow(statuses, dir).entries()).map(([prop, src]) => {
          const alias: Map<string, string> = getOrThrow(aliases, dir)
          return `import * as ${getOrThrow(alias, prop)} from ${_toSpecifier(src)}`
        })
      ]),
      ...globalStatus.map(({ prop, src }) => `import * as __${prop} from ${_toSpecifier(src)}`),
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
            : `${indent()}${JSON.stringify(path)}: ${joinAndWrap(chain.map(toAlias), { wrapType: '[]' })},`
        })
        .filter(Boolean),
      { comma: true }
    ),
    '}',
    ''
  ])
}
