import { fics, type FiCs } from 'ficsjs'
import { fill, layout, maskIcon, radius, rect, space } from 'ficsjs/style'

export interface Props {
  svg: string
  ariaLabel: string
  isDisabled?: boolean
  isBottomFixed?: boolean
  click: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { ariaLabel, isDisabled },
  template,
  isBrowser,
  attributes: { disabled }
}) => template`
  <button type="button" aria-label="${ariaLabel}" ${disabled(!isBrowser || isDisabled)}>
    <span></span>
  </button>
`

const css: FiCs.Css<{}, Props> = ({ props: { svg, isBottomFixed } }) =>
  `button {
    ${
      (isBottomFixed &&
        `
      ${fill('bg')};
      ${radius('sm')};
      position: fixed;
      bottom: ${space('xl')};
      right: ${space('lg')};
      z-index: 1;
  
      @container ${layout('compact')} { bottom: ${space('lg')}; right: ${space('md')}; }`) ||
      ''
    }

    > span { ${rect(8, 8)}; ${maskIcon(svg)}; }
  }`

const actions: FiCs.Actions<{}, Props> = {
  button: {
    click: [
      ({ props: { isDisabled, click } }) => !isDisabled && click(),
      { throttleMs: 500, blur: true }
    ]
  }
}

export default () => fics<{}, Props>({ name: 'icon', html, css, actions })
