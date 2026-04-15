import { fics } from 'ficsjs'
import Icon from '@/components/Icon'
import { dark } from '@/utils'
import { MoveHorizontal, MoveVertical } from 'lucide-static'

export default fics<{}, { isHorizontal: boolean; click: () => void }>({
  name: 'axis-button',
  className: 'fixed bottom-8 left-4 z-1',
  children: [Icon()],
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: ({ props: { isHorizontal, click } }) => ({
      svg: isHorizontal ? MoveVertical : MoveHorizontal,
      ariaLabel: `Switch axis direction to ${isHorizontal ? 'vertical' : 'horizontal'}`,
      isLarge: true,
      isPressed: isHorizontal,
      click
    })
  },
  html: ({ children: { icon }, template }) => template`${icon}`,
  css: `:host { background: ${dark()}; }`
})
