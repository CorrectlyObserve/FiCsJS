import { fics, type FiCs } from 'ficsjs'
import { calc, color, fill, flex, oklch, radius, size, space, stroke } from 'ficsjs/style'
import Icon from '@/components/Icon'
import { X } from 'lucide-static'

interface Data {
  readonly id: string
  isClosing: boolean
}

interface Props {
  author: string
  isOpen: boolean
  close: () => void
}

const props: FiCs.Props<Data, Props> = {
  descendants: ({ children: { icon } }) => icon,
  values: ({ data }) => ({ svg: X, ariaLabel: 'Close', click: () => (data.isClosing = true) })
}

const html: FiCs.Html<Data, Props> = ({
  data: { id },
  props: { author },
  children: { icon },
  template
}) => template`
  <dialog aria-labelledby="${id}">
    <header>
      <h3 id="${id}">Photo details</h3>
      <div>${icon}</div>
    </header>
    <p>Created by ${author}</p>
  </dialog>
`

const css: FiCs.Css<Data, Props> = `
  dialog {
    ${fill('bg-raised')};
    ${radius('lg')};
    width: ${size(80)};
    padding: ${space('md')};
    margin: auto;
    border: ${stroke('sm')} solid ${color('border')};
    box-shadow:
      0 ${size(3)} ${size(4)} ${size(-1)} ${color('shadow')},
      0 ${size(1)} ${size(2)} ${size(-1)} ${color('shadow')};

    &::backdrop { background: ${oklch('#000', { alpha: 0.6 })}; }

    header {
      ${flex({ center: 'x' })}
      position: relative;
      margin-block-end: ${space('md')};

      > div {
        position: absolute;
        top: ${calc(`${space('sm')} * -1`)};
        right: ${calc(`${space('sm')} * -1`)};
      }
    }

    p { text-align: center; }
  }
`

const hooks: FiCs.Hooks<Data, Props> = {
  rerendered: ({ props: { isOpen }, changedKeys, ref }) => {
    if (changedKeys.props.includes('isOpen') && isOpen)
      (ref('dialog') as HTMLDialogElement | null)?.showModal()
  },
  updated: {
    isClosing: ({ data: { isClosing }, ref }) => {
      if (isClosing) (ref('dialog') as HTMLDialogElement | null)?.close()
    }
  }
}

const actions: FiCs.Actions<Data, Props> = {
  dialog: {
    click: ({ event: { target, currentTarget } }) => {
      if (target === currentTarget) (currentTarget as HTMLDialogElement).close()
    },
    close: ({ data, props: { close } }) => {
      data.isClosing = false
      close()
    }
  }
}

export default fics<Data, Props>({
  name: 'dialog',
  children: [Icon()],
  data: () => ({ id: 'title', isClosing: false }),
  props,
  html,
  css,
  hooks,
  actions
})
