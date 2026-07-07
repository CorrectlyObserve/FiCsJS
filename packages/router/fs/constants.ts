export const BASE_DIR = './pages' as const

export const config = {
  DIR: 'src/pages',
  OUTPUT: 'src/routes.gen.ts',
  RPC_CLIENT: 'rpc.client.gen.ts',
  RPC_SERVER: 'rpc.server.gen.ts'
} as const

export const exitCodes = { SUCCESS: 0, FAILURE: 1 } as const

export const EXTENSIONS = ['.js', '.ts'] as const

export const fileNames = {
  LAYOUT: '+layout',
  PAGE: '+page',
  REDIRECT: '+redirect',
  SERVER: '+server',
  SPA: '+spa',
  status: { NOT_FOUND: '+404', SERVER_ERROR: '+500' }
} as const

export const MODULE_EXT_REGEX: RegExp = /\.(?:tsx?|jsx?|mts|mjs|cts|cjs)$/

export const REDIRECT_PATH = '__redirect' as const

export const routerImport = (path: string = '') =>
  `'ficsjs/router${path ? `/${path}` : ''}'` as const

export const segments = {
  CATCH_ALL: /^\[\.\.\.([^[\].]+)\]$/,
  DYNAMIC: /^\[([^[\].]+)\]$/
} as const
