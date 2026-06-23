export const BASE_DIR = './pages' as const

export const configDefaults = { DIR: 'src/pages', OUTPUT: 'src/routes.gen.ts' } as const

export const EXTENSIONS = ['.js', '.ts'] as const

export const fileNames = {
  LAYOUT: '+layout',
  PAGE: '+page',
  REDIRECT: '+redirect',
  SERVER: '+server',
  SPA: '+spa',
  status: { NOT_FOUND: '+404', SERVER_ERROR: '+500' }
} as const

export const rpcFiles = {
  BASE_PATH: '/_rpc',
  CLIENT: 'rpc.client.ts',
  SERVER: 'rpc.server.ts'
} as const

export const segments = {
  CATCH_ALL: /^\[\.\.\.([^[\].]+)\]$/,
  DYNAMIC: /^\[([^[\].]+)\]$/
} as const
