import { escapeRegExp } from '../../../core/helpers'

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

    if (redirect)
      candidates.push({
        id: prefixes.REDIRECT,
        import: `import ${prefixes.REDIRECT} from ${spec(redirect)}`
      })

    return candidates.filter(({ id }) => uses(code, id)).map(({ import: imp }) => imp)
  }
