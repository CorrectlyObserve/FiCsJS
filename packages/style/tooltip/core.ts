import { CSS_LAYER, ficsCssVar } from '../../core/helpers'
import { fill } from '../color'
import { motion } from '../motion'
import { radius } from '../radius'
import { size } from '../size'
import { space } from '../space'
import { stroke } from '../stroke'
import { textSize } from '../textSize'
import { isBlockPlacement, toPlacement } from './placement'
import type { Tooltip } from './types'

export const tooltip = ({
  anchorName = 'tooltip',
  placement = 'top',
  variant = 'arrow'
}: Tooltip = {}): string => {
  const isBlock: boolean = isBlockPlacement(placement),
    { margin, shape }: { margin: string; shape: string } = toPlacement(placement),
    facingEdge: string = `position: absolute; ${placement}: 100%; content: '';` as const

  return `
    ${CSS_LAYER} {
      ${fill('inverse')};
      ${textSize('sm')};
      ${radius('sm')};
      max-width: 13.125rem;
      padding: ${space('xs')} ${space('sm')};
      border: ${stroke('sm')} solid var(${ficsCssVar('fill')});
      opacity: 0;
      visibility: hidden;
      transition: opacity ${motion('fast')}, visibility ${motion('fast')};
      z-index: 1;

      :hover + &, :focus-visible + &, &:hover { opacity: 1; visibility: visible; }
    }

    position: fixed;
    position-anchor: ${ficsCssVar(anchorName)};
    position-area: ${placement};
    ${(variant === 'flip' && `position-try-fallbacks: flip-${isBlock ? 'block' : 'inline'};`) || ''}
    ${isBlock ? 'justify' : 'align'}-self: anchor-center;
    ${margin}: ${space('sm')};
    width: max-content;

    &::before {
      ${facingEdge};
      inset-${isBlock ? 'inline' : 'block'}: 0;
      ${isBlock ? 'height' : 'width'}: ${space('sm')};
    }

    ${
      (variant === 'arrow' &&
        `
          &::after {
            ${facingEdge};
            ${isBlock ? 'left' : 'top'}: 50%;
            width: calc(${size(3)} / ${isBlock ? 1 : 2});
            height: calc(${size(3)} / ${isBlock ? 2 : 1});
            background: inherit;
            translate: ${isBlock ? '-50% 0' : '0 -50%'};
            clip-path: ${shape};
          }
        `) ||
      ''
    }
  `
}
