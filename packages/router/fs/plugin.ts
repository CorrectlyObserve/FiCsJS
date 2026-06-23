import type { Routing } from './../types'
import { configRoutes } from './config'
import { MODULE_EXT_REGEX } from './constants'
import { toAbsolute, toRelative } from './helpers'

const injectRoutes = ({
  id,
  code,
  output
}: {
  code: string
  id: string
  output: string
}): Routing.Transformed | null => {
  const cleanedId: string = id.split('?')[0],
    isModule: boolean = MODULE_EXT_REGEX.test(cleanedId),
    isNodeModule: boolean = cleanedId.includes('/node_modules/'),
    isSameOutput: boolean = toAbsolute({ cleanedId }).cleanedId === output,
    isRouterCalled: boolean = /\bficsRouter\s*(?:<[^>]+>)?\s*\(/.test(code)

  if (!isModule || isNodeModule || isSameOutput || !isRouterCalled) return null

  const relativeId: string = toRelative(cleanedId, output).replace(MODULE_EXT_REGEX, '')
  if (code.includes(`'${relativeId}'`) || code.includes(`"${relativeId}"`)) return null

  return { code: `import '${relativeId}';\n${code}`, map: null }
}

export const routesPlugin = (config: Routing.Config & { watch?: boolean } = {}): Routing.Plugin => {
  const { dir, output }: { dir: string; output: string } = toAbsolute({
    dir: config.dir,
    output: config.output
  })

  return {
    name: 'fics-routes',
    enforce: 'pre',
    buildStart(): void {
      try {
        configRoutes(config)
      } catch (error) {
        throw error
      }
    },
    configureServer({ watcher }: { watcher: { add: (path: string) => void } }): void {
      if (config.watch) watcher.add(dir)
    },
    handleHotUpdate({ file }: { file: string }): void {
      if (file.startsWith(dir))
        try {
          configRoutes(config)
        } catch (error) {
          throw error
        }
    },
    transform(params: { id: string; code: string }): Routing.Transformed | null {
      return injectRoutes({ ...params, output })
    }
  } as const
}
