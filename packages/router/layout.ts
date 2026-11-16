import { hasMethod } from './helpers'
import { isDenial } from './middleware'
import type { Routing } from './types'

export const applyLayout = <T extends Routing.Module>({
  layout,
  page
}: Omit<Routing.Route<T>, 'path'>): T => {
  if (!layout) return page

  const { default: layoutDef }: T = layout,
    { default: pageDef, redirect }: T = page

  if (typeof layoutDef !== 'function' || pageDef === undefined || typeof redirect === 'string')
    return page

  return {
    ...page,
    default: (ctx: Record<string, unknown>): unknown => {
      const slot: unknown = typeof pageDef === 'function' ? pageDef(ctx) : pageDef,
        wrap = (slot: unknown): unknown => (isDenial(slot) ? slot : layoutDef({ ...ctx, slot }))

      return hasMethod<Promise<unknown>>(slot, 'then') ? slot.then(wrap) : wrap(slot)
    }
  }
}
