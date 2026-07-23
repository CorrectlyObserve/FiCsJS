import type { Routing } from '../../types'
import { COMMENT } from '../constants'
import { joinLines, resolveOptions } from '../helpers'
import {
  buildEntries,
  buildLayoutCtx,
  buildMiddlewareCtx,
  buildSpaCtx,
  buildSpecialCtx
} from './builder'
import { findClientEntries } from './finder'
import {
  generateEntries,
  generateExports,
  generateImports,
  generateMiddleware,
  generateSpaRouters
} from './generator'

export const generateRoutes = (
  filePaths: string[],
  options?: Routing.Options.Generate
): {
  routeSrc: string
  mwSrc: string
  clientEntries: Routing.ClientEntries
  missingSpaDirs: string[]
} => {
  const { baseDir, extensions }: { baseDir: string; extensions: Routing.Extensions } =
      resolveOptions(options),
    routes: Routing.RouteEntry[] = buildEntries({ filePaths, extensions, baseDir }),
    layout: Routing.Ctx.Layout = buildLayoutCtx({ routes, filePaths, extensions }),
    spa: Routing.Ctx.Spa = buildSpaCtx({ routes, filePaths, extensions }),
    mw: Routing.Ctx.Middleware = buildMiddlewareCtx({
      routes,
      filePaths,
      extensions,
      spaOwners: spa.spaOwners,
      files: spa.files
    }),
    special: Routing.Ctx.Special = buildSpecialCtx({ dirs: spa.dirs, filePaths, extensions }),
    all: Routing.Ctx.All = { routes, ...layout, ...spa, ...mw, ...special }

  return {
    routeSrc: joinLines([
      COMMENT,
      generateImports({ baseDir, ...all }),
      '',
      joinLines(generateEntries(all)),
      generateSpaRouters(all),
      generateExports(all)
    ]),
    mwSrc: generateMiddleware({ baseDir, ...all }),
    ...findClientEntries({ ...all, filePaths, extensions })
  }
}
