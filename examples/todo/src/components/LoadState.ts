import { fics, type FiCs } from 'ficsjs'
import { spin } from 'ficsjs/animation'
import { color, flex, forScreenReaders, maskIcon, rect, space } from 'ficsjs/style'
import Button from '@/components/Button'
import { Loader } from 'lucide-static'

interface Props {
  isError: boolean
  texts: { loading: string; error: string; retry: string }
  retry: () => void
}

const props: FiCs.Props<{}, Props> = {
  descendants: ({ children: { button } }) => button,
  values: ({ props: { texts, retry } }) => ({
    type: 'gradient',
    fixedUnit: 32,
    buttonText: texts.retry,
    click: retry
  })
}

const html: FiCs.Html<{}, Props> = ({
  children: { button },
  props: { isError, texts },
  template,
  attributes: {
    a11y: { ariaHidden, liveStatus }
  }
}) => {
  const state = isError ? 'error' : 'loading'
  return template`
    <div class="${state}">
      <p ${isError ? liveStatus : 'role="alert"'}>${texts[state]}</p>
      ${isError ? template`${button}` : `<div ${ariaHidden}></div>`}
    </div>
  `
}

const css: FiCs.Css<{}, Props> = `
  div {
    &.loading {
      > p { ${forScreenReaders} }

      > div {
        ${rect(16, 16)}
        ${spin()}
        ${maskIcon(Loader)}
        color: ${color('text')};
        margin: ${space('sm')} auto;
      }
    }

    &.error {
      ${flex({ direction: 'column', gap: space('md') })}
      padding-block: ${space('lg')};
    }
  }
`

export default () => fics<{}, Props>({ name: 'load-state', children: [Button()], props, html, css })
