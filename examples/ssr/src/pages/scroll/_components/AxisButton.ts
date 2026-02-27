import { fics } from 'ficsjs'
import Icon from '@/components/Icon'
import { dark } from '@/utils'
import { MoveHorizontal, MoveVertical } from 'lucide-static'

export default fics<{}, { isHorizontal: boolean; click: () => void }>({
  name: 'axis-button',
  className: 'fixed top-12 right-4 z-1',
  children: [Icon()],
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: ({ props: { isHorizontal, click } }) => ({
      svg: isHorizontal ? MoveVertical : MoveHorizontal,
      areaLabel: `Switch axis direction to ${isHorizontal ? 'vertical' : 'horizontal'}`,
      isLarge: true,
      isPressed: isHorizontal,
      click
    })
  },
  html: ({ children: { icon }, template }) => template`${icon}`,
  css: { ':host': { background: dark() } }
})
