import { throwWindowError } from './errors'

let hasLoaded: boolean = false

export const getHasLoaded = (): boolean => hasLoaded

export const useClient = (): void => {
  throwWindowError()
  if (typeof document === 'undefined') throw new Error('document is not defined...')

  const completeLoading = (): void => {
    hasLoaded = true
  }
  const controlEventListener = (type: 'add' | 'remove'): void => {
    window[`${type}EventListener`]('DOMContentLoaded', completeLoading)
  }

  if (document.readyState === 'loading') controlEventListener('add')
  else {
    controlEventListener('remove')
    completeLoading()
  }
}
