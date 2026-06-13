import { fics, type FiCs } from 'ficsjs'
import Icon from '@/components/Icon'
import { dark } from '@/utils'
import { MoveHorizontal, MoveVertical } from 'lucide-static'

interface Props {
  isHorizontal: boolean
  click: () => void
}

const props: FiCs.Props<{}, Props> = {
  descendants: ({ children: { icon } }) => icon,
  values: ({ props: { isHorizontal, click } }) => ({
    svg: isHorizontal ? MoveVertical : MoveHorizontal,
    ariaLabel: `Switch axis direction to ${isHorizontal ? 'vertical' : 'horizontal'}`,
    isLarge: true,
    isPressed: isHorizontal,
    click
  })
}

const html: FiCs.Html<{}, Props> = ({ children: { icon }, template }) => template`${icon}`

const css: FiCs.Css<{}, Props> = `:host { background: ${dark()}; }`

export default fics<{}, Props>({
  name: 'axis-button',
  className: 'fixed bottom-8 left-4 z-1',
  children: [Icon()],
  props,
  html,
  css
})
