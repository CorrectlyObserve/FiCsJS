import { createState } from 'ficsjs/state'

export type Axis = 'horizontal' | 'vertical'

export const $axis = createState<Axis>('vertical', {
  sessionStorage: {
    key: 'axis',
    validate: (value): value is Axis => value === 'horizontal' || value === 'vertical'
  }
})
