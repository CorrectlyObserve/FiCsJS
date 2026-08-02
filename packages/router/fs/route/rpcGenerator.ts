import { RPC_BASE_PATH } from '../../constants'
import type { Routing, Rpc, TypeNode } from '../../types'
import { fileNames, prefixes, segments } from '../constants'
import {
  buildRoute,
  getFiles,
  getOrThrow,
  indent,
  joinAndWrap,
  joinLines,
  resolveOptions
} from '../helpers'
import { getAllMiddlewares } from '../middleware'

const newNode = (): TypeNode => ({ children: new Map() }),
  renderType = ({ alias, children, dynamic }: TypeNode): string => {
    const operands: string[] = []

    if (alias) operands.push(`typeof ${alias}`)

    if (children.size > 0) {
      const members: string[] = [...children.entries()].map(
        ([segment, child]) => `${JSON.stringify(segment)}: ${renderType(child)}`
      )
      operands.push(joinAndWrap(members, { separator: ';' }))
    }

    if (dynamic) operands.push(`((${dynamic.name}: string) => ${renderType(dynamic.node)})`)

    return operands.length > 0 ? operands.join(' & ') : 'Record<never, never>'
  }

export const generateRpcs = ({
  filePaths,
  options,
  basePath = RPC_BASE_PATH,
  middlewareAlias
}: Routing.Options.Generate & { middlewareAlias: Map<string, string> }): Rpc.Generated | null => {
  const { baseDir, extensions }: ReturnType<typeof resolveOptions> = resolveOptions(options),
    rpcs: Routing.RpcEntries = getFiles({
      filePaths,
      extensions,
      expectedType: fileNames.RPC,
      baseDir
    })

  if (rpcs.length === 0) return null

  const aliases: string[] = rpcs.map((_, index) => `rpc${index}`),
    files: Map<string, string> = getFiles({
      filePaths,
      extensions,
      expectedType: fileNames.MIDDLEWARE
    }),
    root: TypeNode = newNode(),
    manifests: string[] = []

  for (const [index, { dirs }] of rpcs.entries()) {
    const alias: string = aliases[index],
      mws: string[] = getAllMiddlewares(dirs, files)

    for (const mw of mws)
      if (!middlewareAlias.has(mw))
        middlewareAlias.set(mw, `${prefixes.MIDDLEWARE}${middlewareAlias.size}`)

    const values: string[] = [`prefix: ${JSON.stringify(buildRoute(dirs))}`, `module: ${alias}`]
    if (mws.length > 0)
      values.push(
        `middlewares: ${joinAndWrap(
          mws.map(mw => getOrThrow(middlewareAlias, mw)),
          { wrapType: '[]' }
        )}`
      )

    manifests.push(joinAndWrap(values))

    let node: TypeNode = root
    for (const segment of dirs) {
      if (segments.CATCH_ALL.test(segment))
        throw new Error(
          `The catch-all segment "${segment}" is not supported for RPC procedures... `
        )

      const dynamic: RegExpMatchArray | null = segment.match(segments.DYNAMIC)
      if (dynamic) {
        const paramName: string = dynamic[1]

        if (node.dynamic && node.dynamic.name !== paramName)
          throw new Error(
            `The dynamic segment "[${paramName}]" conflicts with the existing dynamic segment "[${node.dynamic.name}]" at the same level...`
          )

        node.dynamic ??= { name: paramName, node: newNode() }
        node = node.dynamic.node
      } else {
        if (!node.children.has(segment)) node.children.set(segment, newNode())
        node = node.children.get(segment)!
      }
    }

    node.alias = alias
  }

  const importModules = (type: 'client' | 'server'): string[] =>
    rpcs.map(
      ({ specifier }, index) =>
        `import ${type === 'client' ? 'type ' : ''}* as ${aliases[index]} from '${specifier}'`
    )

  return {
    client: {
      imports: importModules('client'),
      body: `export const api = createRpcClient<${renderType(root)}>('${basePath}')`
    },
    server: {
      imports: importModules('server'),
      body: joinLines([
        'export const rpcRouter = {',
        `${indent()}basePath: '${basePath}',`,
        `${indent()}procedures: [`,
        joinLines(
          manifests.map(entry => `${indent(2)}${entry}`),
          { comma: true }
        ),
        `${indent()}]`,
        '}'
      ])
    }
  }
}
