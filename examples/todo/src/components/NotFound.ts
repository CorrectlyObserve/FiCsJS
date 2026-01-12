import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { cssVar, forScreenReaders } from 'ficsjs/style'
import Button from '@/components/materials/Button'
import Loading from '@/components/materials/Loading'
import { Lang } from '@/types'
import { breakpoints } from '@/utils/others'

interface Data {
  seconds: number
  heading: string
  descriptions: string[]
  buttonText: string
}

const MAX = 20 as const

export default fics<Data, { lang: Lang }>({
  name: 'not-found',
  children: [Button(), Loading()],
  data: () => ({ seconds: MAX, descriptions: [] }),
  i18nData: ({ props: { lang }, i18n }) => i18n<Data>({ lang, key: 'notFound' }),
  props: {
    descendant: ({ children: { button } }) => button,
    values: ({ data: { buttonText } }) => ({
      type: 'gradation',
      buttonText,
      click: () => goto('/', { isWithoutHistory: true })
    })
  },
  html: ({
    children: { button, loading },
    data: {
      seconds,
      heading,
      descriptions: [start, end]
    },
    template,
    attributes: { statusLiveRegion },
    isDeferred
  }) =>
    isDeferred
      ? template`
          <h2>404 ${heading}</h2>
          <p ${statusLiveRegion}>${start}${MAX}${end}</p>
          <p aria-hidden="true">${start}${seconds}${end}</p>
          ${button}
        `
      : template`${loading}`,
  css: {
    p: {
      '&[role="status"]': forScreenReaders,
      '&[aria-hidden="true"]': {
        marginBottom: cssVar('xl'),
        [`@media (max-width: ${breakpoints.sm})`]: { marginBottom: cssVar('lg') }
      }
    }
  },
  hooks: {
    mounted: ({ data, poll }) => {
      data.seconds = MAX

      poll(
        ({ times }) => {
          if (times === MAX - 1) goto('/', { isWithoutHistory: true })
          else data.seconds--
        },
        { interval: 1000, max: MAX }
      )
    }
  },
  options: { lazyLoad: true }
})
