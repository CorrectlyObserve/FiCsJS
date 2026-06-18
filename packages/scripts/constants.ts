export const CLI_DIR = 'dist/router/fs' as const
export const CLI_FILE = 'cli.js' as const
export const CLI_PATH = `${CLI_DIR}/${CLI_FILE}` as const

export const BIN_DIR = '../node_modules/.bin' as const
export const BIN_LINK = `${BIN_DIR}/fics-routes` as const
export const BIN_TARGET = `../ficsjs/${CLI_PATH}` as const

export const EXECUTABLE_MODE = 0o755 as const
export const exitCodes = { SUCCESS: 0, FAILURE: 1 } as const
