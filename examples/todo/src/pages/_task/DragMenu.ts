import { fics, type FiCs } from 'ficsjs'
import { color, flex, radius, space, stroke } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { MENU_ID, type ButtonStates, type Direction, type ReorderLabels } from '@/pages/_task/drag'
import { ArrowDownFromLine, ArrowUpFromLine, CopyPlus } from 'lucide-static'

interface Props {
  labels: ReorderLabels
  isCopyMode: boolean
  buttonStates: ButtonStates
  switchCopyMode: () => void
  move: (direction: Direction) => void
}

const SVGS = { copy: CopyPlus, up: ArrowUpFromLine, down: ArrowDownFromLine } as const
const html: FiCs.Html<{}, Props> = ({
  children: { icon },
  props: { labels, isCopyMode, buttonStates, switchCopyMode, move },
  template
}) => template`
  ${(Object.keys(SVGS) as (keyof typeof SVGS)[]).map(button => {
    const isCopyButton = button === 'copy'
    return template`
      ${icon.setIndividualProps(button, {
        svg: SVGS[button],
        ariaLabel: labels[button],
        isDisabled: buttonStates[button] === 'disabled',
        state: isCopyButton && isCopyMode ? 'pressed' : undefined,
        isFocused: buttonStates[button] === 'focused',
        click: () => (isCopyButton ? switchCopyMode() : move(button))
      })}
    `
  })}
`

const css: FiCs.Css<{}, Props> = `
  :host {
    ${flex({ center: 'y', gap: space('xs') })}
  }
`

export default fics<{}, Props>({ name: MENU_ID, children: [Icon()], html, css })
