import { watch } from 'node:fs'
import { dirname, join } from 'node:path'

const INPUT = 'src/global.css' as const,
  OUTPUT = 'static/dist/global.css' as const,
  EMBEDDED = 'src/tailwind.generated.ts' as const

const args: string[] = ['--input', INPUT, '--output', OUTPUT, '--minify']
const isWatch: boolean = process.argv.includes('--watch')
if (isWatch) args.push('--watch')

const pkg: string = Bun.resolveSync('@tailwindcss/cli/package.json', import.meta.dir),
  cli: string = join(dirname(pkg), (await Bun.file(pkg).json()).bin.tailwindcss)

const tailwind = Bun.spawn([process.execPath, cli, ...args], {
  stdio: ['inherit', 'inherit', 'inherit']
})
const embed = async (): Promise<void> => {
  const css: string = await Bun.file(OUTPUT).text()
  await Bun.write(EMBEDDED, `export default ${JSON.stringify(css)}\n`)
}

if (isWatch) watch(OUTPUT, () => void embed())
else {
  const exitCode: number = await tailwind.exited
  if (exitCode !== 0) process.exit(exitCode)

  await embed()
}
