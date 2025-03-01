import { fics } from 'ficsjs'
import { i18n } from 'ficsjs/i18n'
import { goto } from 'ficsjs/router'
import { variable } from 'ficsjs/style'
import Icon from '@/components/materials/Icon'
import Button from '@/components/materials/Button'
import { breakpoints, getPath } from '@/utils'

interface Data {
  seconds: number
  heading: string
  descriptions: string[]
  buttonText: string
}

const button = Button()
const loadingIcon = Icon('loading')

export default () =>
  fics<Data, { lang: string }>({
    name: 'not-found',
    data: () => ({ seconds: 10, descriptions: [], buttonText: '' }),
    fetch: ({ props: { lang } }) => i18n<Data>({ lang, key: 'notFound' }),
    props: [
      {
        descendant: button,
        values: ({ props: { lang } }) => ({
          buttonText: ({ getData }) => getData('buttonText'),
          click: () => goto(getPath(lang, '/'))
        })
      }
    ],
    html: ({
      data: {
        seconds,
        heading,
        descriptions: [start, end]
      },
      template,
      isLoaded
    }) =>
      isLoaded
        ? template`<h2>404 ${heading}</h2><p>${start}${seconds}${end}</p>${button}`
        : template`${loadingIcon}`,
    css: {
      p: {
        marginBottom: variable('xl'),
        [`@media (max-width: ${breakpoints.sm})`]: { marginBottom: variable('lg') }
      }
    },
    hooks: {
      mounted: ({ data: { seconds }, props: { lang }, setData, poll }) =>
        poll(
          ({ times }) => {
            if (times === seconds - 1) goto(getPath(lang, '/'))
            setData('seconds', seconds - times - 1)
          },
          { interval: 1000, max: seconds }
        )
    },
    options: { lazyLoad: true }
  })
