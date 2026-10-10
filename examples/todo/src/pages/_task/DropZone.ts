import { fics, type FiCs } from 'ficsjs'
import { cssVar, size } from 'ficsjs/style'
import { white } from '@/styles/theme'

interface Props {
  height: number
  isShown: boolean
  isValidIndex: (isCopyMode: boolean) => boolean
  show: () => void
  hide: () => void
  drop: (fromIndex: number, isCopyMode: boolean) => void
}

const html: FiCs.Html<{}, Props> = ({ props: { isShown }, template }) =>
  template`<div${isShown && ' class="is-shown"'}></div>`

const css: FiCs.Css<{}, Props> = ({ props: { height } }) => `
  div {
    height: ${size(2)};
    border-radius: ${size(2)};
    transition: ${cssVar('transition')};

    &.is-shown {
      height: ${height}px;
      margin-block: ${size(2)};
      background: ${white(0.1)};
      border: ${cssVar('outline')} dashed ${cssVar('red')};
    }
  }
`

const actions: FiCs.Actions<{}, Props> = {
  div: {
    dragover: ({ props: { isValidIndex, show, hide }, event }) => {
      const drag = event as DragEvent
      drag.preventDefault()
      if (!drag.dataTransfer) return

      drag.dataTransfer.dropEffect = drag.altKey ? 'copy' : 'move'
      isValidIndex(drag.altKey) ? show() : hide()
    },
    dragleave: ({ props: { hide } }) => hide(),
    drop: ({ props: { isShown, drop }, event }) => {
      const drag = event as DragEvent
      drag.preventDefault()

      if (!drag.dataTransfer || !isShown) return

      drop(parseInt(drag.dataTransfer.getData('text/plain')), drag.altKey)
    }
  }
}

export default fics<{}, Props>({
  name: 'drop-zone',
  attributes: { 'aria-hidden': 'true' },
  html,
  css,
  actions
})
