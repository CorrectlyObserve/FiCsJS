import { fics, type FiCs } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { forScreenReaders, size } from 'ficsjs/style'
import Button from '@/components/materials/Button'
import Loading from '@/components/materials/Loading'
import type { Lang } from '@/utils/lang'
import { breakpoints } from '@/utils/others'

interface Data {
  seconds: number
  heading: string
  descriptions: string[]
  buttonText: string
  isCounting: boolean
}

interface Props {
  lang: Lang
}

const MAX = 20 as const

const props: FiCs.Props<Data, Props> = {
  descendants: ({ children: { button } }) => button,
  values: () => ({ fixedUnit: 48 })
}

const html: FiCs.Html<Data, Props> = ({
  children: { button, loading },
  data,
  template,
  attributes: { statusLiveRegion },
  isDeferred
}) => {
  if (!isDeferred) return template`${loading}`

  const {
    seconds,
    heading,
    descriptions: [start, end, pause, restart],
    buttonText,
    isCounting
  } = data

  return template`
    <h2>404 ${heading}</h2>
    <p ${statusLiveRegion}>${start}${seconds}${end}</p>
    <p aria-hidden="true">${start}${seconds}${end}</p>
    <div>
      ${button.setIndividualProps('back', {
        type: 'gradation',
        buttonText,
        click: () => goto('/', { isWithoutHistory: true })
      })}
      ${button.setIndividualProps('count', {
        type: 'normal',
        buttonText: isCounting ? pause : restart,
        click: () => (data.isCounting = !data.isCounting)
      })}
    </div>
  `
}

const css: FiCs.Css<Data, Props> = `
  p {
    &[role="status"] {${forScreenReaders}}

    &[aria-hidden="true"] {
      margin-block-end: ${size(8)};
      @media (max-width: ${breakpoints.SM}) { margin-block-end: ${size(6)}; }
    }
  }

  div {
    display: flex;
    flex-direction: column;
    gap: ${size(4)};
  }
`

const hooks: FiCs.Hooks<Data, Props> = {
  mounted: ({ data, poll }) => {
    data.seconds = MAX

    poll(
      () => {
        if (!data.isCounting) return

        if (data.seconds <= 1) {
          data.seconds = 0
          goto('/', { isWithoutHistory: true })
          return
        }

        data.seconds--
      },
      { intervalMs: 1000, exit: () => data.seconds <= 0 }
    )
  }
}

export default fics<Data, Props>({
  name: 'not-found',
  children: [Button(), Loading()],
  data: () => ({ seconds: MAX, descriptions: [], isCounting: true }),
  i18nData: ({ props: { lang }, i18n }) => i18n<Data>({ lang, key: 'notFound' }),
  props,
  html,
  css,
  hooks,
  options: { lazyLoad: true }
})
