import { convertStr } from './../../../core/helpers'
import { fileNames, REDIRECT_PATH, routerImport } from './../constants'
import { buildRoute, getDirName, indent, joinLines, toSpecifier } from './../helpers'
import type { LayoutContext, RouteEntry, SpaContext, SpecialFilesContext } from './types'

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
    alias,
    shouldApply = true
  }: {
    base: string
    layout: string | null
    alias: Routing.Ctx.Layout['alias']
    shouldApply?: boolean
  }): string => {
    if (layout === null || !shouldApply) return base
    return `${base}, layout: ${alias.get(layout)}`
  }

export const generateEntries = ({
  routes,
  layouts,
  layoutAliases,
  spaAlias,
  routeSpaDirs,
  routeIsSpaEntry,
  presentStatus
}: { routes: RouteEntry[] } & LayoutContext & SpaContext & SpecialFilesContext): string => {
  const mainRoutes: string[] = [],
    catchAllRoutes: string[] = []

  for (let i = 0; i < routes.length; i++) {
    const { path }: RouteEntry = routes[i],
      spaDir: string | null = routeSpaDirs[i],
      layout: string | null = layouts[i]

    if (spaDir === null) {
      mainRoutes.push(
        buildEntry({ path, config: buildPageConfig({ base: `route${i}`, layout, layoutAliases }) })
      )
      continue
    }

    if (routeIsSpaEntry[i]) {
      const ref: string = `(route${i} as { meta?: Record<string, string> })`,
        config: string = buildPageConfig({
          base: `{ default: () => ${spaAlias.get(spaDir)}.toString(), meta: ${ref}.meta }`,
          layout,
          layoutAliases
        })

      mainRoutes.push(buildEntry({ path, config }))

      const prefix: string = spaDir ? `${buildRoute(spaDir.split('/'))}/` : ''
      catchAllRoutes.push(buildEntry({ path: `/${prefix}:rest*`, config }))
    }
  }

  return joinLines(
    [
      ...mainRoutes,
      ...presentStatus.map(({ urlPath, propName }) =>
        buildEntry({ path: urlPath, config: `__${propName}` })
      ),
      ...catchAllRoutes
    ],
    { comma: true }
  )
}

export const generateExports = (
  routes: RouteEntry[],
  { presentStatus, redirectSource }: SpecialFilesContext
): string => {
  const uniquePaths: string[] = [
    ...new Set([...routes.map(({ path }) => path), ...presentStatus.map(({ urlPath }) => urlPath)])
  ]

  return joinLines([
    ...Object.keys(fileNames.status).map(key => {
      const propName: string = convertStr(key, 'camel')
      return `export const ${propName} = ${
        presentStatus.some(({ propName: pn }) => pn === propName) ? `__${propName}` : 'undefined'
      }`
    }),
    `export const redirects = ${redirectSource ? REDIRECT_PATH : 'undefined'}`,
    `export type FiCsRoutingPath = ${uniquePaths.length === 0 ? 'never' : uniquePaths.map(path => `'${path}'`).join(' | ')}`
  ])
}

export const generateImports = (
  baseDir: string,
  routes: RouteEntry[],
  { uniqueLayouts, layoutAliases }: LayoutContext,
  { spaDirs, spaFiles, spaConfigAlias }: SpaContext,
  { presentStatus, redirectSource, spaStatusSources, spaStatusAlias }: SpecialFilesContext
): string => {
  const _toSpecifier = (path: string): string => `'${toSpecifier(path, baseDir)}'`
  return joinLines(
    [
      spaDirs.length > 0 ? `import { ficsRouter } from ${routerImport()}` : '',
      redirectSource ? `import ${REDIRECT_PATH} from ${_toSpecifier(redirectSource)}` : '',
      ...presentStatus.map(
        ({ propName, source }) => `import * as __${propName} from ${_toSpecifier(source)}`
      ),
      ...spaDirs.flatMap(dir => [
        `import ${spaConfigAlias.get(dir)} from ${_toSpecifier(spaFiles.get(dir)!)}`,
        ...Array.from(spaStatusSources.get(dir)!.entries()).map(
          ([propName, src]) =>
            `import * as ${spaStatusAlias.get(dir)!.get(propName)} from ${_toSpecifier(src)}`
        )
      ]),
      ...uniqueLayouts.map(
        src => `import * as ${layoutAliases.get(src)} from ${_toSpecifier(src)}`
      ),
      ...routes.map(({ specifier }, index) => `import * as route${index} from '${specifier}'`)
    ].filter(line => line !== '')
  )
}

export const generateRegisterRoutes = ({ currentStatuses, redirect }: Routing.Ctx.Special): string => {
  const options: string[] = ['routes']

  if (redirect) options.push(`redirects: ${prefixes.REDIRECT}`)
  if (currentStatuses.length > 0)
    options.push(
      `statusModules: { ${currentStatuses.map(({ prop }) => `${prop}: __${prop}`).join(', ')} }`
    )

  return `registerRoutes({ ${options.join(', ')} })`
}

export const generateSpaRouters = ({
  routes,
  layouts,
  layoutAliases,
  spaDirs,
  spaAlias,
  spaConfigAlias,
  routeSpaDirs,
  spaStatusSources,
  spaStatusAlias
}: { routes: RouteEntry[] } & LayoutContext & SpaContext & SpecialFilesContext): string => {
  return joinLines(
    spaDirs.map(dir => {
      const routeEntries: string[] = []

      for (let i = 0; i < routes.length; i++) {
        if (routeSpaDirs[i] !== dir) continue

        const layout: string | null = layouts[i],
          isUnderBoundary = (layout: string): boolean => getDirName(layout).startsWith(`${dir}/`)

        routeEntries.push(
          buildEntry({
            length: 3,
            path: routes[i].path,
            config: buildPageConfig({
              base: `route${i}`,
              layout,
              layoutAliases,
              shouldApply: isUnderBoundary(layout!)
            })
          })
        )
      }

      const lines: string[] = [
          `export const ${spaAlias.get(dir)} = ficsRouter(${spaConfigAlias.get(dir)}, {`,
          `${indent(2)}routes: [`,
          joinLines(routeEntries, { comma: true }),
          `${indent(2)}]`
        ],
        statusKeys: string[] = Array.from(spaStatusSources.get(dir)?.keys() || [])

      if (statusKeys.length > 0) {
        lines[lines.length - 1] += ','
        lines.push(
          `${indent(2)}statusModules: {`,
          joinLines(
            statusKeys.map(key => `${indent(3)}${key}: ${spaStatusAlias.get(dir)?.get(key)}`),
            { comma: true }
          ),
          `${indent(2)}}`
        )
      }

      return joinLines([...lines, '})'])
    })
  )
}
