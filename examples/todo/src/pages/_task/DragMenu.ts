import { fics, type FiCs } from 'ficsjs'
import { cssVar, flexCenter, size } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { Direction, MENU_ID, type ReorderLabels } from '@/pages/_task/drag'
import { white } from '@/styles/theme'
import { ArrowDownFromLine, ArrowUpFromLine, CopyPlus } from 'lucide-static'

interface Props {
  labels: ReorderLabels
  isCopyMode: boolean
  disabledDirections: Direction[]
  switchCopyMode: () => void
  move: (direction: Direction) => void
}

const SVGS = { copy: CopyPlus, up: ArrowUpFromLine, down: ArrowDownFromLine } as const
const html: FiCs.Html<{}, Props> = ({
  children: { icon },
  props: { labels, isCopyMode, disabledDirections, switchCopyMode, move },
  template
}) => template`
  ${(Object.keys(SVGS) as (keyof typeof SVGS)[]).map(button => {
    const isCopyButton = button === 'copy'
    return template`
        ${icon.setIndividualProps(button, {
          svg: SVGS[button],
          ariaLabel: labels[button],
          isPressed: isCopyButton ? isCopyMode : undefined,
          isDisabled: !isCopyButton && disabledDirections.includes(button),
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
