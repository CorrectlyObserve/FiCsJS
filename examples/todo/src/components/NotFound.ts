import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { cssVar } from 'ficsjs/style'
import Button from '@/components/materials/Button'
import LoadingIcon from '@/components/LoadingIcon'
import { Lang } from '@/types'
import { breakpoints } from '@/utils/others'

interface Data {
  seconds: number
  heading: string
  descriptions: string[]
  buttonText: string
}

const MAX = 10 as const

export default fics<Data, { lang: Lang }>({
  name: 'not-found',
  children: [Button(), LoadingIcon],
  data: () => ({ seconds: MAX, descriptions: [] }),
  i18nData: ({ props: { lang }, i18n }) => i18n<Data>({ lang, key: 'notFound' }),
  props: [
    {
      descendant: ({ children: { button } }) => button,
      values: ({ data: { buttonText } }) => ({
        buttonText,
        click: () => goto('/', { isWithoutHistory: true })
      })
    },
    {
      descendant: ({ children: { loadingIcon } }) => loadingIcon,
      values: ({ props: { lang } }) => ({ lang })
    }
  ],
  html: ({
    children: { button, loadingIcon },
    data: {
      seconds,
      heading,
      descriptions: [start, end]
    },
    template,
    isDeferred
  }) =>
    isDeferred
      ? template`<h2>404 ${heading}</h2><p>${start}${seconds}${end}</p>${button}`
      : template`${loadingIcon}`,
  css: {
    p: {
      marginBottom: cssVar('xl'),
      [`@media (max-width: ${breakpoints.sm})`]: { marginBottom: cssVar('lg') }
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
