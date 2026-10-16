import { fics, type FiCs } from 'ficsjs'
import { spin } from 'ficsjs/animation'
import { color, flex, forScreenReaders, maskIcon, rect, space } from 'ficsjs/style'
import Button from '@/components/Button'
import { white } from '@/styles/theme'
import { Loader } from 'lucide-static'

interface Props {
  isError: boolean
  texts: { loading: string; error: string; retry: string }
  retry: () => void
}

const props: FiCs.Props<{}, Props> = {
  descendants: ({ children: { button } }) => button,
  values: ({ props: { texts, retry } }) => ({
    type: 'gradation',
    fixedUnit: 32,
    buttonText: texts.retry,
    click: retry
  })
}

const html: FiCs.Html<{}, Props> = ({
  children: { button },
  props: { isError, texts },
  template,
  unsafeHtml,
  attributes: {
    a11y: { ariaHidden, statusLiveRegion }
  }
}) => {
  const state = isError ? 'error' : 'loading'
  return template`
    <div class="${state}">
      <p ${isError ? statusLiveRegion : 'role="alert"'}>${texts[state]}</p>
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
        margin: ${space('sm')} auto;
      }
    }

    &.error {
      ${flex({ direction: 'column', gap: space('md') })}
      padding-block: ${space('lg')};
    }
  }
    
  .loading {
    > p { ${forScreenReaders} }

    > div {
      padding: ${space('sm')};
      text-align: center;

      svg {
        ${rect(16)}
        ${spin()}
        stroke: ${white()}
      }
    }
  }
`

export default () => fics<{}, Props>({ name: 'load-state', children: [Button()], props, html, css })
