import { createState } from 'ficsjs/state'
import Photos from '@/pages/scroll/Photos'

export type Axis = 'horizontal' | 'vertical'

export const $axis = createState<Axis>('vertical', {
  sessionStorage: {
    key: 'axis',
    validate: (value): value is Axis => value === 'horizontal' || value === 'vertical'
  }
})

$axis.subscribe('axis', axis => Photos.setData('axis', axis))
