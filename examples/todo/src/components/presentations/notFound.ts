import { fics } from 'ficsjs'
import button from '@/components/presentations/button'
import goto from '@/utils'

interface Props {
  lang: string
  title: string
  buttonText: string
}

export default fics<{}, Props>({
  name: 'not-found',
  props: {
    descendants: button,
    values: ({ $props: { buttonText, lang } }) => ({ buttonText, click: () => goto(lang) })
  },
  html: ({ $props: { title }, $template }) => $template`<h2>404 ${title}</h2>${button}`
})
