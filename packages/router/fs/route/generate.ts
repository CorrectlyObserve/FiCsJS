import { convertStr } from './../../../core/helpers'
import { fileNames, REDIRECT_PATH, routerImport } from './../constants'
import { buildRoute, indent, joinLines, toSpecifier } from './../helpers'
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
    layoutAliases,
    shouldApply = true
  }: {
    base: string
    layout: string | null
    layoutAliases: LayoutContext['layoutAliases']
    shouldApply?: boolean
  }): string => {
    if (layout === null || !shouldApply) return base
    return `${base}, layout: ${layoutAliases.get(layout)}`
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
        buildEntry({
          path,
          config: layout === null ? `route${i}` : `route${i}, layout: ${layoutAliases.get(layout)}`
        })
      )
      continue
    }

    if (routeIsSpaEntry[i]) {
      const ref: string = `(route${i} as { meta?: Record<string, string> })`,
        module: string = `{ default: () => ${spaAlias.get(spaDir)}.toString(), meta: ${ref}.meta }`,
        config: string = `${layout === null ? module : `${module}, layout: ${layoutAliases.get(layout)}`}`

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

export const generateOptions = ({ presentStatus, redirectSource }: SpecialFilesContext): string => {
  const options: string[] = ['']

  if (redirectSource) options.push(`redirects: ${REDIRECT_PATH}`)
  if (presentStatus.length > 0)
    options.push(
      `statusModules: { ${presentStatus.map(({ propName: pn }) => `${pn}: __${pn}`).join(', ')} }`
    )

  return options.length > 1 ? options.join(', ') : ''
}
