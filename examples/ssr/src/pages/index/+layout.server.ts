import type { FiCsRouter } from 'ficsjs/router'
import { FAIL_USER, type User } from '@/domain/user'
import { requireUser } from '@/server/guards'

const layout: FiCsRouter.SsrLayout<{ req: Request }> = async ({ slot, req }) => {
  const { name, role }: User = await requireUser({ req })

  if (new URL(req.url).searchParams.has(FAIL_USER))
    throw new Error('The user store is unreachable.')

  return `
    <p>Signed in as ${name} (The role is ${role}).</p>
    ${slot}
  `
}

export default layout
