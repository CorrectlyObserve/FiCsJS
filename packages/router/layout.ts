import { hasMethod } from './helpers'
import type { Routing } from './types'

export const applyLayout = ({
  layout: { default: layoutDef },
  page
}: {
  layout: Routing.Module
  page: Routing.Module
}): Routing.Module => {
  const { default: pageDef, redirect }: Routing.Module = page

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
