import type { Routing, Rpc } from '../../types'
import { resolveOptions } from '../helpers'
import { assembleClient } from './assembler'
import { buildEntries, buildLayout, buildMiddleware, buildSpa, buildSpecial } from './builder'
import { findClientEntries } from './finder'
import { generateRpcs } from './rpcGenerator'

export const generateRoutes = ({
  filePaths,
  options,
  basePath
}: Routing.Options.Generate): ReturnType<typeof findClientEntries> & {
  clientSrc: string
  serverSrc: string | null
} => {
  const { baseDir, extensions }: ReturnType<typeof resolveOptions> = resolveOptions(options),
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
    ctx: Routing.Build.Ctx = { routes, ...layout, ...spa, ...mw, ...special },
    rpc: Rpc.Generated | null = generateRpcs({
      filePaths,
      options,
      basePath,
      middlewareAlias: ctx.middlewareAlias
    }),
    hasMpaRoute: boolean = ctx.spaOwners.some(owner => owner === null),
    hasMiddleware: boolean = ctx.uniqueMiddlewares.length > 0

  return {
    clientSrc: assembleClient({ ctx, baseDir, rpc }),
    serverSrc:
      hasMpaRoute || hasMiddleware || rpc !== null ? assembleServer(ctx, baseDir, rpc) : null,
    ...findClientEntries({ ...ctx, filePaths, extensions })
  }
}
