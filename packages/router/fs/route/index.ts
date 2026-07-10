import type { Routing } from './../../types'
import { COMMENT, routerImport } from './../constants'
import { indent, joinLines, resolveOptions } from './../helpers'
import { buildEntries, buildLayoutCtx, buildSpaCtx, buildSpecialCtx } from './builder'
import {
  generateEntries,
  generateExports,
  generateImports,
  generateRegisterRoutes,
  generateSpaRouters
} from './generate'

export const generateRoutes = (filePaths: string[], options?: Routing.Options.Generate): string => {
  const { baseDir, extensions }: { baseDir: string; extensions: Routing.Extensions } =
      resolveOptions(options),
    routes: Routing.RouteEntry[] = buildEntries({ filePaths, extensions, baseDir }),
    layout: Routing.Ctx.Layout = buildLayoutCtx({ routes, filePaths, extensions }),
    spa: Routing.Ctx.Spa = buildSpaCtx({ routes, filePaths, extensions }),
    special: Routing.Ctx.Special = buildSpecialCtx({ dirs: spa.dirs, filePaths, extensions }),
    all: Routing.Ctx.All = { routes, ...layout, ...spa, ...special }

  return joinLines([
    COMMENT,
    `import { registerRoutes } from ${routerImport()}`,
    generateImports({ baseDir, ...all }),
    '',
    generateSpaRouters(all),
    generateExports(routes, special),
    `export const routes = [`,
    `${indent()}${generateEntries(all)}`,
    `]`,
    '',
    generateRegisterRoutes(special)
  ])
}
