import { createState } from 'ficsjs/state'

export const $userName = createState<string>('', { sessionStorage: { key: 'userName' } })
