import { fics } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { Direction } from '@/types'
import { ArrowDownFromLine, ArrowUpFromLine, CopyPlus } from 'lucide-static'

interface Data {
  isCopy: boolean
  buttons: (isCopy: boolean) => {
    id: 'action' | Direction
    svg: string
    ariaLabel: string
    isPressed?: boolean
  }[]
}

interface Props {
  isDisabled: boolean
  isAtFirst: boolean
  isAtLast: boolean
  moveItem: (direction: Direction, isCopy: boolean) => void | Promise<void>
}

export default fics<Data, Props>({
  name: 'menu',
  children: [Icon()],
  data: () => ({
    isCopy: false,
    buttons: (isCopy: boolean) => [
      {
        id: 'action',
        svg: CopyPlus,
        ariaLabel: `Switch to ${isCopy ? 'move' : 'copy'} mode`,
        isPressed: isCopy
      },
      {
        id: 'up',
        svg: ArrowUpFromLine,
        ariaLabel: `${isCopy ? 'Copy' : 'Move'} the selected item upward`
      },
      {
        id: 'down',
        svg: ArrowDownFromLine,
        ariaLabel: `${isCopy ? 'Copy' : 'Move'} the selected item downward`
      }
    ]
  }),
  className: 'fixed bottom-8 left-4 z-1',
  html: ({
    children: { icon },
    data,
    props: { isDisabled, isAtFirst, isAtLast, moveItem },
    template,
    attributes: { statusLiveRegion }
  }) => {
    const { isCopy, buttons } = data

    return template`
      <p class="sr-only" ${statusLiveRegion}>The current mode is ${isCopy ? 'copy' : 'move'}.</p>
      ${buttons(isCopy).map(({ id, svg, ariaLabel, isPressed }) => {
        const isFirstItem = id === 'up' && isAtFirst,
          isLastItem = id === 'down' && isAtLast

        return template`
          ${icon.setIndividualProps(id, {
            svg,
            ariaLabel,
            isLarge: true,
            isDisabled: isDisabled || (!isCopy && (isFirstItem || isLastItem)),
            isActive: isCopy && id === 'action',
            isPressed,
            click: async () => {
              if (id === 'action') {
                data.isCopy = !data.isCopy
                return
              }

              await moveItem(id, isCopy)
            }
          })}
        `
      })}
    `
  },
  css: { ':host': flexCenter('y', 'column') }
})
