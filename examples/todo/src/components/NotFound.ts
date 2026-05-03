import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { forScreenReaders, size } from 'ficsjs/style'
import Button from '@/components/materials/Button'
import Loading from '@/components/materials/Loading'
import { Lang } from '@/types'
import { breakpoints } from '@/utils/others'

interface Data {
  seconds: number
  heading: string
  descriptions: string[]
  buttonText: string
  isCounting: boolean
}

const MAX = 20 as const

export default fics<Data, { lang: Lang }>({
  name: 'not-found',
  children: [Button(), Loading()],
  data: () => ({ seconds: MAX, descriptions: [], isCounting: true }),
  i18nData: ({ props: { lang }, i18n }) => i18n<Data>({ lang, key: 'notFound' }),
  props: {
    descendant: ({ children: { button } }) => button,
    values: () => ({ fixedUnit: 48 })
  },
  html: ({
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
  },
  css: ({ cssToString }) => `
    p {
      &[role="status"] {${cssToString(forScreenReaders)}}

      &[aria-hidden="true"] {
        margin-block-end: ${size(8)};

        @media (max-width: ${breakpoints.sm}) {
          margin-block-end: ${size(6)};
        }
      }
    }

    div {
      display: flex;
      flex-direction: column;
      gap: ${size(4)};
    }
  `,
  hooks: {
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
        { interval: 1000, exit: () => data.seconds <= 0 }
      )
    }
  },
  options: { lazyLoad: true }
})
