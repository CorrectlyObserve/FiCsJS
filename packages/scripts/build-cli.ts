import {
  BIN_DIR,
  BIN_LINK,
  BIN_TARGET,
  CLI_DIR,
  CLI_FILE,
  CLI_PATH,
  EXECUTABLE_MODE,
  exitCodes
} from './constants'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  chmodSync,
  copyFileSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  unlinkSync
} from 'node:fs'
import { platform } from 'node:os'

const isWindows: boolean = platform() === 'win32'

/** @remarks Cleans dist */
rmSync('dist', { recursive: true, force: true })

/** @remarks Compiles with tsc; aborts the build on type errors */
const { status }: { status: number | null } = spawnSync('bunx', ['tsc'], {
  stdio: 'inherit',
  shell: isWindows
})
if (status !== exitCodes.SUCCESS) process.exit(status ?? exitCodes.FAILURE)

/** @remarks Bundles the CLI into a self-contained, Node-runnable file */
const { success, logs }: Bun.BuildOutput = await Bun.build({
  entrypoints: ['router/fs/cli.ts'],
  outdir: CLI_DIR,
  format: 'esm',
  target: 'node',
  naming: CLI_FILE
})

if (!success) {
  for (const log of logs) console.error(log)
  process.exit(exitCodes.FAILURE)
}

/** @remarks Prepends the Node shebang */
await Bun.write(CLI_PATH, `#!/usr/bin/env node\n${await Bun.file(CLI_PATH).text()}`)

/** @remarks Makes the CLI executable for the shebang launcher */
chmodSync(CLI_PATH, EXECUTABLE_MODE)

/** @remarks Ensures node_modules/.bin exists */
mkdirSync(BIN_DIR, { recursive: true })

/** @remarks Removes any stale fics-routes link */
if (existsSync(BIN_LINK)) unlinkSync(BIN_LINK)

try {
  symlinkSync(BIN_TARGET, BIN_LINK)
} catch (error) {
  if (isWindows) {
    /** @remarks Windows fallback when symlinks aren't permitted. */
    copyFileSync(`${BIN_DIR}/${BIN_TARGET}`, BIN_LINK)

    console.warn('The file was copied to .bin, as the symlink permission was denied...')
  } else throw error
}
