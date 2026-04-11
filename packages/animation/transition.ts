import type { TransitionMode } from './types'

const transformStyle = (transform?: string) => (transform ? ({ transform } as const) : {}),
  transformMap = {
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)',
    left: 'translateX(-100%)',
    right: 'translateX(100%)'
  } as const

const style = (
  transition: string,
  mode: TransitionMode,
  transform?: { base: string; inOut: string }
) => {
  const { base, inOut }: { base?: string; inOut?: string } = transform || {}
  return {
    opacity: 1,
    transition: `${transition.trim()} allow-discrete`,
    ...transformStyle(base),
    ...(mode.startsWith('in')
      ? { '@starting-style': { opacity: 0, ...transformStyle(inOut) } as const }
      : {}),
    ...(mode.endsWith('out')
      ? { '&[style*="display: none"]': { opacity: 0, ...transformStyle(inOut) } as const }
      : {})
  } as const
}

export const fade = (transition: string, mode: TransitionMode = 'in-out') => style(transition, mode)

export const slide = (
  direction: 'top' | 'bottom' | 'left' | 'right',
  transition: string,
  mode: TransitionMode = 'in-out'
) => style(transition, mode, { base: 'translate(0)', inOut: transformMap[direction] })

export const zoom = (transition: string, mode: TransitionMode = 'in-out') =>
  style(transition, mode, { base: 'scale(1)', inOut: 'scale(0.95)' })
