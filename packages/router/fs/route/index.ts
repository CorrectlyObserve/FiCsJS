import type { Routing } from '../../types'
import { resolveOptions } from '../helpers'
import { generateRpcs } from '../rpc'
import { buildEntries, buildLayout, buildMiddleware, buildSpa, buildSpecial } from './builder'
import { findClientEntries } from './finder'
import {
  generateEntries,
  generateExports,
  generateImports,
  generateMiddleware,
  generateSpaRouters
} from './generator'

export const generateRoutes = ({
  filePaths,
  options,
  basePath
}: Routing.Options.Generate): ReturnType<typeof findClientEntries> & {
  clientSrc: string
  serverSrc: string | null
} => {
  const { baseDir, extensions }: { baseDir: string; extensions: Routing.Extensions } =
      resolveOptions(options),
    routes: Routing.RouteEntry[] = buildEntries({ filePaths, extensions, baseDir }),
    layout: Routing.Build.Layout = buildLayout({ routes, filePaths, extensions }),
    spa: Routing.Build.Spa = buildSpa({ routes, filePaths, extensions }),
    mw: Routing.Build.Middleware = buildMiddleware({
      routes,
      filePaths,
      extensions,
      spaOwners: spa.spaOwners,
      files: spa.files
    }),
    special: Routing.Build.Special = buildSpecial({ dirs: spa.dirs, filePaths, extensions }),
    all: Routing.Build.Ctx = { routes, ...layout, ...spa, ...mw, ...special }

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
