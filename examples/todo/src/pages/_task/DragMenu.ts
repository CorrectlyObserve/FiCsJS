import { fics, type FiCs } from 'ficsjs'
import { cssVar, flexCenter, size } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { MENU_ID, type ButtonStates, type Direction, type ReorderLabels } from '@/pages/_task/drag'
import { white } from '@/styles/theme'
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
        isPressed: isCopyButton ? isCopyMode : undefined,
        isDisabled: buttonStates[button] === 'disabled',
        isFocused: buttonStates[button] === 'focused',
        click: () => (isCopyButton ? switchCopyMode() : move(button))
      })}
    `
  })}
`

const css: FiCs.Css<{}, Props> = `
  :host {
    ${flexCenter('y')}
    gap: ${size(1)};
    background: ${cssVar('black')};
    border: ${cssVar('outline')} solid ${white(0.2)};
    border-radius: ${size(2)};
  }
`

export default fics<{}, Props>({ name: MENU_ID, children: [Icon()], html, css })
