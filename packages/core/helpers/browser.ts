export const browserError = (): void => {
  if (!isBrowser()) throw new Error('Window and document are not available...')
}

export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined'
