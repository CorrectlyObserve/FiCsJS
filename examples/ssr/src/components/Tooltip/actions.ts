import type { FiCs } from 'ficsjs'

type EventHandler = 'keydown' | 'mouseenter' | 'mouseleave' | 'blur'

const escapeListeners: WeakMap<EventTarget, (event: KeyboardEvent) => void> = new WeakMap()

const toTooltip = (element: EventTarget | null): HTMLElement | null =>
  (element as HTMLElement | null)?.querySelector<HTMLElement>("[role='tooltip']") ?? null

const hide = (element: EventTarget | null): void => {
  toTooltip(element)?.style.setProperty('display', 'none')
}

const show = (element: EventTarget | null): void => {
  toTooltip(element)?.style.removeProperty('display')
}

export const tooltipHandlers = <D extends object, P>(): Record<
  EventHandler,
  FiCs.Action<D, P>
> => ({
  keydown: ({ event }) => {
    if ((event as KeyboardEvent).key === 'Escape') hide(event.currentTarget)
  },
  mouseenter: ({ event: { currentTarget } }) => {
    if (!currentTarget || escapeListeners.has(currentTarget)) return

    const listener = ({ key }: KeyboardEvent): void => {
      if (key === 'Escape') hide(currentTarget)
    }

    escapeListeners.set(currentTarget, listener)
    document.addEventListener('keydown', listener)
  },
  mouseleave: ({ event: { currentTarget } }) => {
    const listener: ((event: KeyboardEvent) => void) | undefined = currentTarget
      ? escapeListeners.get(currentTarget)
      : undefined

    if (listener) document.removeEventListener('keydown', listener)
    if (currentTarget) escapeListeners.delete(currentTarget)

    show(currentTarget)
  },
  blur: ({ event: { currentTarget } }) => show(currentTarget)
})
