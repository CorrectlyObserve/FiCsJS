import type { FiCs } from 'ficsjs'

type EventHandler = 'keydown' | 'mouseenter' | 'mouseleave' | 'pointerdown' | 'blur'

const escapeListeners: WeakMap<EventTarget, (event: KeyboardEvent) => void> = new WeakMap()

const controlTooltip = (element: EventTarget | null, action: 'hide' | 'reset'): void => {
  const tooltip: HTMLElement | null =
    (element as HTMLElement | null)?.querySelector<HTMLElement>("[role='tooltip']") ?? null

  if (tooltip === null) return

  if (action === 'hide') tooltip.style.setProperty('display', 'none')
  else tooltip.style.removeProperty('display')
}

export const tooltipHandlers = <D extends object, P>(): Record<
  EventHandler,
  FiCs.Action<D, P>
> => ({
  keydown: ({ event }) => {
    if ((event as KeyboardEvent).key === 'Escape') controlTooltip(event.currentTarget, 'hide')
  },
  mouseenter: ({ event: { currentTarget } }) => {
    if (!currentTarget || escapeListeners.has(currentTarget)) return

    const listener = ({ key }: KeyboardEvent): void => {
      if (key === 'Escape') controlTooltip(currentTarget, 'hide')
    }

    escapeListeners.set(currentTarget, listener)
    document.addEventListener('keydown', listener)
  },
  mouseleave: ({ event: { currentTarget } }) => {
    if (currentTarget) {
      const listener: ((event: KeyboardEvent) => void) | undefined =
        escapeListeners.get(currentTarget)

      if (listener) {
        document.removeEventListener('keydown', listener)
        escapeListeners.delete(currentTarget)
      }
    }

    controlTooltip(currentTarget, 'reset')
  },
  pointerdown: ({ event: { currentTarget } }) => controlTooltip(currentTarget, 'hide'),
  blur: ({ event: { currentTarget } }) => {
    if (!(currentTarget as Element | null)?.matches(':hover'))
      controlTooltip(currentTarget, 'reset')
  }
})
