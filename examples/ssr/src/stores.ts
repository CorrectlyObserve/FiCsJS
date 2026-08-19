import { createState } from 'ficsjs/state'

export const $isHorizontal = createState<boolean>(false, {
  sessionStorage: {
    key: 'isHorizontal',
    validate: (value): value is boolean => typeof value === 'boolean'
  }
})

export const $userName = createState<string>('', { sessionStorage: { key: 'userName' } })
