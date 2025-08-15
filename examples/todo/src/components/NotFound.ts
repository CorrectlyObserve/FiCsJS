import { fics } from 'ficsjs'
import { cssVar } from 'ficsjs/style'
import Button from '@/components/materials/Button'
import LoadingIcon from '@/components/LoadingIcon'
import { Lang } from '@/types'
import { backToTop, breakpoints } from '@/utils'

interface Data {
  seconds: number
  heading: string
  descriptions: string[]
  buttonText: string
}

export default fics<Data, { lang: Lang }>({
  name: 'not-found',
  children: [Button(), LoadingIcon],
  data: () => ({ seconds: 10, descriptions: [], buttonText: '' }),
  i18nData: ({ props: { lang }, i18n }) => i18n<Data>({ lang, key: 'notFound' }),
  props: [
    {
      descendant: ({ children: { button } }) => button,
      values: ({ props: { lang } }) => ({
        buttonText: ({ getData }) => getData('buttonText'),
        click: () => backToTop(lang)
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
    mounted: ({ data: { seconds }, props: { lang }, setData, poll }) =>
      poll(
        ({ times }) => {
          if (times === seconds - 1) backToTop(lang)
          setData('seconds', seconds - times - 1)
        },
        { interval: 1000, max: seconds }
      )
  },
  options: { lazyLoad: true }
})
