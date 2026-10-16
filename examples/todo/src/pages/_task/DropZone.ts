import { fics, type FiCs } from 'ficsjs'
import { color, motion, radius, size, space, stroke } from 'ficsjs/style'

interface Props {
  height: number
  isActive: boolean
  isValidIndex: (isCopyMode: boolean) => boolean
  activate: () => void
  deactivate: () => void
  drop: (fromIndex: number, isCopyMode: boolean) => void
}

const html: FiCs.Html<{}, Props> = ({ props: { isActive }, template }) =>
  template`<div${isActive && ' class="is-active"'}></div>`

const css: FiCs.Css<{}, Props> = ({ props: { height } }) => `
  div {
    height: ${size(2)};
    border-radius: ${size(2)};
    transition: ${cssVar('transition')};

    &.is-active {
      height: ${height}px;
      margin-block: ${space('sm')};
    }
  }
`

const actions: FiCs.Actions<{}, Props> = {
  div: {
    dragover: ({ props: { isValidIndex, activate, deactivate }, event }) => {
      const drag = event as DragEvent
      drag.preventDefault()
      if (!drag.dataTransfer) return

      drag.dataTransfer.dropEffect = drag.altKey ? 'copy' : 'move'
      isValidIndex(drag.altKey) ? activate() : deactivate()
    },
    dragleave: ({ props: { deactivate } }) => deactivate(),
    drop: ({ props: { isActive, drop }, event }) => {
      const drag = event as DragEvent
      drag.preventDefault()

      if (!drag.dataTransfer || !isActive) return

      drop(parseInt(drag.dataTransfer.getData('text/plain')), drag.altKey)
    }
  }
}

export default fics<{}, Props>({
  name: 'drop-zone',
  attributes: ({ a11y: { ariaHidden } }) => ariaHidden,
  html,
  css,
  actions
})
