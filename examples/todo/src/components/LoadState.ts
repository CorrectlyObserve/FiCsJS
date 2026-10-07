import { fics, type FiCs } from 'ficsjs'
import { spin } from 'ficsjs/animation'
import { forScreenReaders, rect, size } from 'ficsjs/style'
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
  attributes: { statusLiveRegion }
}) =>
  isError
    ? template`<div class="error"><p role="alert">${texts.error}</p>${button}</div>`
    : template`
        <div class="loading">
          <p ${statusLiveRegion}>${texts.loading}</p>
          <div aria-hidden="true">${unsafeHtml(Loader)}</div>
        </div>
      `

const css: FiCs.Css<{}, Props> = `
  .loading {
    > p {${forScreenReaders}}

    > div {
      padding: ${size(2)};
      margin-inline: auto;

      svg {
        ${rect(16)}${spin()}
        display: flex;
        stroke: ${white()};
      }
    }
  }

  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${size(4)};
    padding-block: ${size(8)};
  }
`

export default () => fics<{}, Props>({ name: 'load-state', children: [Button()], props, html, css })
