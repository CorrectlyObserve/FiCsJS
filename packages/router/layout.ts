import { hasMethod } from './helpers'
import type { Routing } from './types'

export const applyLayout = <T extends Routing.Module>({
  layout,
  page
}: Omit<Routing.Route<T>, 'path'>): T => {
  if (!layout) return page

  const { default: layoutDef }: T = layout,
    { default: pageDef, redirect }: T = page

  if (typeof layoutDef !== 'function' || typeof redirect === 'string') return page

  return {
    ...page,
    default: (ctx: Record<string, unknown>): unknown => {
      const slot: unknown = typeof pageDef === 'function' ? pageDef(ctx) : pageDef

      return hasMethod<Promise<unknown>>(slot, 'then')
        ? slot.then(resolvedSlot => layoutDef({ ...ctx, slot: resolvedSlot }))
        : layoutDef({ ...ctx, slot })
    }
  }
}
