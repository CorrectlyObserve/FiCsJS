import { convertStr } from './../../../core/helpers'
import type { Routing } from './../../types'
import { fileNames, prefixes, routerImport } from './../constants'
import { buildRoute, getDirName, indent, joinLines, toSpecifier } from './../helpers'

const buildEntry = ({
    length,
    path,
    config
  }: {
    length?: number
    path: string
    config: string
  }): string => `${indent(length)}{ path: '${path}', page: ${config} }`,
  buildPageConfig = ({
    base,
    layout,
    layoutAlias,
    shouldApply = true
  }: {
    base: string
    layout: string | null
    layoutAlias: Routing.Ctx.Layout['layoutAlias']
    shouldApply?: boolean
  }): string => {
    if (layout === null || !shouldApply) return base
    return `${base}, layout: ${layoutAlias.get(layout)}`
  }

export const generateEntries = ({
  routes,
  layouts,
  layoutAlias,
  spaAlias,
  spaOwners,
  areSpaRoot,
  globalStatus
}: Routing.Ctx.All): string => {
  const mainRoutes: string[] = [],
    catchAllRoutes: string[] = []

  for (let i = 0; i < routes.length; i++) {
    const { path }: Routing.RouteEntry = routes[i],
      spaOwner: string | null = spaOwners[i],
      layout: string | null = layouts[i]

    if (spaOwner === null) {
      mainRoutes.push(
        buildEntry({
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

  return joinLines(
    [
      ...mainRoutes,
      ...globalStatus.map(({ path, prop }) => buildEntry({ path, config: `__${prop}` })),
      ...catchAllRoutes
    ],
    { comma: true }
  )
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
}: { baseDir: string } & Routing.Ctx.All): string => {
  const _toSpecifier = (src: string): string => `'${toSpecifier(src, baseDir)}'`
  return joinLines(
    [
      dirs.length > 0 ? `import { ficsRouter } from ${routerImport()}` : '',
      redirect ? `import ${prefixes.REDIRECT} from ${_toSpecifier(redirect)}` : '',
      ...globalStatus.map(({ prop, src }) => `import * as __${prop} from ${_toSpecifier(src)}`),
      ...dirs.flatMap(dir => [
        `import ${configAlias.get(dir)} from ${_toSpecifier(files.get(dir)!)}`,
        ...Array.from(statuses.get(dir)!.entries()).map(
          ([prop, src]) => `import * as ${aliases.get(dir)!.get(prop)} from ${_toSpecifier(src)}`
        )
      ]),
      ...uniques.map(src => `import * as ${layoutAlias.get(src)} from ${_toSpecifier(src)}`),
      ...routes.map(({ specifier }, index) => `import * as route${index} from '${specifier}'`)
    ].filter(line => line !== '')
  )
}

export const generateRegisterRoutes = ({ globalStatus, redirect }: Routing.Ctx.Special): string => {
  const options: string[] = ['routes']

  if (redirect) options.push(`redirects: ${prefixes.REDIRECT}`)
  if (globalStatus.length > 0)
    options.push(
      `statusModules: { ${globalStatus.map(({ prop }) => `${prop}: __${prop}`).join(', ')} }`
    )

  return `registerRoutes({ ${options.join(', ')} })`
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
  aliases
}: Routing.Ctx.All): string => {
  return joinLines(
    dirs.map(dir => {
      const routeEntries: string[] = []

      for (let i = 0; i < routes.length; i++) {
        if (spaOwners[i] !== dir) continue

        const layout: string | null = layouts[i],
          isUnderBoundary = (layout: string): boolean => getDirName(layout).startsWith(`${dir}/`)

        routeEntries.push(
          buildEntry({
            length: 2,
            path: routes[i].path,
            config: buildPageConfig({
              base: `route${i}`,
              layout,
              layoutAlias,
              shouldApply: layout !== null && isUnderBoundary(layout)
            })
          })
        )
      }

      const lines: string[] = [
          `export const ${spaAlias.get(dir)} = ficsRouter(${configAlias.get(dir)}, {`,
          `${indent()}routes: [`,
          joinLines(routeEntries, { comma: true }),
          `${indent()}]`
        ],
        statusKeys: string[] = Array.from(statuses.get(dir)?.keys() || [])

      if (statusKeys.length > 0) {
        lines[lines.length - 1] += ','
        lines.push(
          `${indent(2)}statusModules: {`,
          joinLines(
            statusKeys.map(key => `${indent(3)}${key}: ${aliases.get(dir)?.get(key)}`),
            { comma: true }
          ),
          `${indent(2)}}`
        )
      }

      return joinLines([...lines, '})'])
    })
  )
}
