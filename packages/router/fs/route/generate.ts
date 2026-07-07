import { REDIRECT_PATH, routerImport } from './../constants'

export const generateExports = (
  routes: RouteEntry[],
  { presentStatus, redirectSource }: SpecialFilesContext
): string => {
  const uniquePaths: string[] = [
    ...new Set([...routes.map(({ path }) => path), ...presentStatus.map(({ urlPath }) => urlPath)])
  ]

  return joinLines([
    ...Object.values(STATUS_FILES).map(
      ({ propName }) =>
        `export const ${propName} = ${presentStatus.find(({ propName: pn }) => pn === propName) ? `__${propName}` : 'undefined'}`
    ),
    `export const redirects = ${redirectSource ? REDIRECT_PATH : 'undefined'}`,
    `export type AppPath = ${uniquePaths.length === 0 ? 'never' : uniquePaths.map(path => `'${path}'`).join(' | ')}`
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
