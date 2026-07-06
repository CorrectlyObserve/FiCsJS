import { joinLines } from '../helpers'
import { STATUS_FILES, type RouteEntry, type SpecialFilesContext } from './types'

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
    `export const redirects = ${redirectSource ? '__redirect' : 'undefined'}`,
    `export type AppPath = ${uniquePaths.length === 0 ? 'never' : uniquePaths.map(path => `'${path}'`).join(' | ')}`
  ])
}
