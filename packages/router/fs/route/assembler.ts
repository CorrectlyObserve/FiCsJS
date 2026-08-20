import { escapeRegExp } from '../../../core/helpers'
import type { Routing } from '../../types'
import { COMMENT, prefixes, ROUTER, routerImport } from '../constants'
import { getOrThrow, joinAndWrap, joinLines, toSpecifier } from '../helpers'
import { generateEntries, generatePages, generateSpaRouters } from './generator'

const uses = (code: string, id: string): boolean =>
    new RegExp(`\\b${escapeRegExp(id)}\\b`).test(code),
  emitModuleImports = ({
    routes,
    uniqueLayouts,
    layoutAlias,
    dirs,
    files,
    configAlias,
    spaOwners,
    statuses,
    aliases,
    globalStatuses,
    statusFallback,
    redirect,
    baseDir,
    code
  }: Routing.Build.Ctx & { baseDir: string; code: string }): string[] => {
    const spec = (src: string): string => `'${toSpecifier(src, baseDir)}'`,
      candidates: { id: string; import: string }[] = []

    for (const layout of uniqueLayouts) {
      const id: string = getOrThrow(layoutAlias, layout)
      candidates.push({ id, import: `import * as ${id} from ${spec(layout)}` })
    }

    for (let index = 0; index < routes.length; index++) {
      const { serverSpecifier, specifier }: Routing.RouteEntry = routes[index]

      if (serverSpecifier !== null) {
        candidates.push({
          id: `server${index}`,
          import: `import * as server${index} from '${serverSpecifier}'`
        })
      }

      if (spaOwners[index] !== null) {
        candidates.push({
          id: `client${index}`,
          import: `import * as client${index} from '${specifier}'`
        })
      }
    }

    for (const dir of dirs) {
      const configId: string = getOrThrow(configAlias, dir)
      candidates.push({
        id: configId,
        import: `import ${configId} from ${spec(getOrThrow(files, dir))}`
      })

      for (const [key, src] of getOrThrow(statuses, dir)) {
        const id: string = getOrThrow(getOrThrow(aliases, dir), key)
        candidates.push({ id, import: `import * as ${id} from ${spec(src)}` })
      }
    }

    for (const { prop, serverSrc } of globalStatuses)
      if (serverSrc !== null)
        candidates.push({
          id: `__${prop}`,
          import: `import * as __${prop} from ${spec(serverSrc)}`
        })

    if (statusFallback?.serverSrc)
      candidates.push({
        id: prefixes.ERROR,
        import: `import * as ${prefixes.ERROR} from ${spec(statusFallback.serverSrc)}`
      })

    if (redirect)
      candidates.push({
        id: prefixes.REDIRECT,
        import: `import ${prefixes.REDIRECT} from ${spec(redirect)}`
      })

    return candidates.filter(({ id }) => uses(code, id)).map(({ import: imp }) => imp)
  }

export const assembleClient = ({ ctx, baseDir, rpc }: Routing.Options.Assemble): string => {
  const { routes, globalStatuses, redirect }: Routing.Build.Ctx = ctx,
    uniquePaths: string[] = Array.from(
      new Set([...routes, ...globalStatuses].map(({ path }) => path))
    ),
    code: string = joinLines(
      [
        generateSpaRouters(ctx),
        rpc?.client.code ?? '',
        `export const redirects = ${redirect ? prefixes.REDIRECT : 'undefined'}`,
        `export type FiCsRoutingPath = ${uniquePaths.length === 0 ? 'never' : uniquePaths.map(path => `'${path}'`).join(' | ')}`
      ],
      { filter: true }
    )

  let imports: string[] = emitModuleImports({ ...ctx, baseDir, code })

  const routerNames: string[] = []
  if (uses(code, ROUTER)) routerNames.push(ROUTER)
  if (uses(code, 'createRpcClient')) routerNames.push('createRpcClient')

  if (routerNames.length > 0)
    imports = [`import ${joinAndWrap(routerNames)} from ${routerImport()}`, ...imports]

  if (rpc && (rpc.client.imports ?? []).length > 0) imports.push(...rpc.client.imports)

  return joinLines([COMMENT, joinLines(imports), '', code, ''])
}

export const assembleServer = ({ ctx, baseDir, rpc }: Routing.Options.Assemble): string => {
  const code: string = joinLines(
      [joinLines(generateEntries(ctx)), generatePages(ctx), rpc?.server.code ?? ''],
      { filter: true }
    ),
    imports: string[] = []

  for (const [src, id] of ctx.middlewareAlias)
    if (uses(code, id)) imports.push(`import ${id} from '${toSpecifier(src, baseDir)}'`)

  imports.push(...emitModuleImports({ ...ctx, baseDir, code }))
  if (rpc && rpc.server.imports.length > 0) imports.push(...rpc.server.imports)

  const usedClientExports: string[] = []

  for (const name of [...ctx.spaAlias.values(), 'redirects'])
    if (uses(code, name)) usedClientExports.push(name)

  if (usedClientExports.length > 0)
    imports.push(`import ${joinAndWrap(usedClientExports)} from './client'`)

  return joinLines([
    COMMENT,
    `import ${routerImport('server-only')}`,
    joinLines(imports, { filter: true }),
    '',
    code,
    ''
  ])
}
