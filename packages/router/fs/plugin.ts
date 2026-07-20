import type { Routing, VitePlugin } from '../types'
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
}): { code: string; map: null } | null => {
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

/** @remarks Depends on Vite. */
export const viteRoutesPlugin = (config: Routing.Config & { watch?: boolean } = {}): VitePlugin => {
  const { dir, output }: { dir: string; output: string } = toAbsolute({
    dir: config.dir,
    output: config.output
  })

  return {
    name: 'fics-routes',
    enforce: 'pre',
    buildStart(): void {
      configRoutes(config)
    },
    configureServer({ watcher }: { watcher: { add: (path: string) => void } }): void {
      if (config.watch ?? true) watcher.add(dir)
    },
    handleHotUpdate({ file }: { file: string }): void {
      if (file.startsWith(dir)) configRoutes(config)
    },
    transform(code: string, id: string): { code: string; map: null } | null {
      return injectRoutes({ id, code, output })
    }
  } as const
}
